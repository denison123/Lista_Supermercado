// server/src/server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Carrega variáveis de ambiente do arquivo .env

// Usar o cliente MongoDB
const { MongoClient, ObjectId } = require('mongodb'); // Importa MongoClient e ObjectId

const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente ou 3000

// Middleware para parsear JSON no corpo das requisições
app.use(bodyParser.json());

// Habilitar CORS para permitir requisições do frontend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // EM PRODUÇÃO: Mude * para o domínio do seu frontend (ex: 'https://seufilme.netlify.app')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// --- Configuração do Banco de Dados MongoDB ---
const uri = process.env.MONGODB_URI; // Sua string de conexão do MongoDB
const dbName = 'supermarketDB'; // Nome do seu banco de dados no MongoDB

if (!uri) {
    console.error('ERRO: A variável de ambiente MONGODB_URI não está definida.');
    console.error('Por favor, crie/atualize o arquivo .env na raiz do projeto (lista-supermercado-web/) com MONGODB_URI="sua_string_de_conexao_mongodb".');
    process.exit(1); // Encerra o processo se a variável não estiver definida
}

let db; // Variável global para armazenar a conexão com o banco de dados

async function connectToMongoDB() {
    try {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(dbName);
        console.log('Conectado ao banco de dados MongoDB com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        process.exit(1); // Encerra o processo se não puder conectar ao DB
    }
}

// Chamar a função de conexão ao iniciar o servidor
connectToMongoDB();

// Middleware para garantir que a conexão com o DB esteja pronta antes das rotas
app.use((req, res, next) => {
    if (!db) {
        return res.status(503).json({ error: 'Servidor indisponível, banco de dados não conectado.' });
    }
    next();
});


// --- Rotas da API RESTful ---

// Rota para obter todos os itens
app.get('/api/items', async (req, res) => {
    try {
        const items = await db.collection('items').find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error('Erro ao obter itens do MongoDB:', err.message);
        res.status(500).json({ error: 'Erro ao obter itens do banco de dados.' });
    }
});

// Rota para adicionar um novo item
app.post('/api/items', async (req, res) => {
    const { name, quantity, price } = req.body;
    if (!name || quantity === undefined || quantity === null || isNaN(quantity) || parseInt(quantity) <= 0) {
        return res.status(400).json({ error: 'Nome do item e quantidade válida são obrigatórios.' });
    }
    const parsedQuantity = parseInt(quantity);
    const parsedPrice = parseFloat(price || 0.0);

    const newItem = {
        name: name,
        quantity: parsedQuantity,
        price: parsedPrice
    };

    try {
        const result = await db.collection('items').insertOne(newItem);
        // MongoDB retorna _id, que precisa ser mapeado para 'id' para o frontend
        res.status(201).json({ id: result.insertedId, ...newItem });
    } catch (err) {
        console.error('Erro ao adicionar item ao MongoDB:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar item ao banco de dados.' });
    }
});

// Rota para atualizar um item
app.put('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, quantity, price } = req.body;

    // Converte o ID da string para ObjectId do MongoDB
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de item inválido.' });
    }
    const objectId = new ObjectId(id);

    let updateFields = {};

    if (name !== undefined) {
        updateFields.name = name;
    }
    if (quantity !== undefined) {
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ error: 'Quantidade inválida.' });
        }
        updateFields.quantity = parsedQuantity;
    }
    if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Preço inválido.' });
        }
        updateFields.price = parsedPrice;
    }

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
    }

    try {
        const result = await db.collection('items').updateOne(
            { _id: objectId },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        if (result.modifiedCount === 0 && result.matchedCount > 0) {
            return res.status(200).json({ message: 'Item encontrado, mas nenhum dado alterado (valores são os mesmos).' });
        }
        res.json({ message: 'Item atualizado com sucesso!', id: id, changes: result.modifiedCount });
    } catch (err) {
        console.error('Erro ao atualizar item no MongoDB:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar item no banco de dados.' });
    }
});


// Rota para remover um item
app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;

    // Converte o ID da string para ObjectId do MongoDB
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de item inválido.' });
    }
    const objectId = new ObjectId(id);

    try {
        const result = await db.collection('items').deleteOne({ _id: objectId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.json({ message: 'Item removido com sucesso!', id });
    } catch (err) {
        console.error('Erro ao remover item do MongoDB:', err.message);
        res.status(500).json({ error: 'Erro ao remover item do banco de dados.' });
    }
});


// Servir arquivos estáticos do Frontend
app.use(express.static(path.join(__dirname, '../../public')));

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Frontend principal acessível em http://localhost:${PORT}/index.html`);
    console.log(`Página de preços acessível em http://localhost:${PORT}/prices.html`);
});
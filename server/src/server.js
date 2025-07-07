// server/src/server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// Garante que as variáveis de ambiente do .env sejam carregadas
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 

// Usar o cliente PostgreSQL
const { Pool } = require('pg');

const app = express();
// Usa a porta definida na variável de ambiente PORT (para deploy) ou 3000 (para local)
const PORT = process.env.PORT || 3000; 

// Middleware para parsear JSON no corpo das requisições
app.use(bodyParser.json());

// Habilitar CORS para permitir requisições do frontend
app.use((req, res, next) => {
    // EM PRODUÇÃO: Mude '*' para o domínio específico do seu frontend (ex: 'https://seulista.netlify.app')
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// --- Configuração do Banco de Dados PostgreSQL ---
// A string de conexão é lida da variável de ambiente DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERRO: A variável de ambiente DATABASE_URL não está definida.');
    console.error('Por favor, crie/atualize um arquivo .env na raiz do projeto (lista-supermercado-web/) com DATABASE_URL="sua_string_de_conexao_postgresql".');
    process.exit(1); // Encerra o processo se a variável não estiver definida
}

const pool = new Pool({
    connectionString: connectionString,
    // Esta configuração SSL é importante para conexões com bancos de dados na nuvem (como Render)
    // Em ambiente local, você pode não precisar dela ou pode configurá-la para 'false'
    // Em produção, 'rejectUnauthorized: false' pode ser necessário se o certificado não for validado
    ssl: {
        rejectUnauthorized: false 
    }
});

// Conectar ao banco de dados e criar a tabela se não existir
pool.connect()
    .then(client => {
        console.log('Conectado ao banco de dados PostgreSQL.');
        // Cria a tabela 'items' com id, name, quantity e price
        return client.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                price NUMERIC(10, 2) DEFAULT 0.00
            );
        `)
        .then(() => {
            console.log('Tabela "items" verificada/criada com campo de quantidade e preço.');
            client.release(); // Libera o cliente de volta para o pool
        })
        .catch(err => {
            console.error('Erro ao criar tabela de itens:', err.message);
            client.release();
            process.exit(1); 
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados PostgreSQL:', err.message);
        process.exit(1); 
    });


// --- Rotas da API RESTful ---

// Rota para obter todos os itens
app.get('/api/items', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, quantity, price FROM items ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao obter itens:', err.message);
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

    try {
        // $1, $2, $3 são placeholders para os parâmetros no pg
        const result = await pool.query(
            'INSERT INTO items (name, quantity, price) VALUES ($1, $2, $3) RETURNING id, name, quantity, price',
            [name, parsedQuantity, parsedPrice]
        );
        // RETURNING id, name, quantity, price retorna o item inserido com o ID gerado
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar item:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar item ao banco de dados.' });
    }
});

// Rota para atualizar um item
app.put('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    const { name, quantity, price } = req.body;

    let updates = [];
    let params = [];
    let paramIndex = 1; // Índice para os placeholders ($1, $2, etc.)

    if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name);
    }
    if (quantity !== undefined) {
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ error: 'Quantidade inválida.' });
        }
        updates.push(`quantity = $${paramIndex++}`);
        params.push(parsedQuantity);
    }
    if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ error: 'Preço inválido.' });
        }
        updates.push(`price = $${paramIndex++}`);
        params.push(parsedPrice);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar fornecido.' });
    }

    params.push(id); // Adiciona o ID como o último parâmetro para a cláusula WHERE

    // A cláusula WHERE usa o último parâmetro adicionado (o ID)
    const sql = `UPDATE items SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

    try {
        const result = await pool.query(sql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado ou nenhum dado alterado.' });
        }
        res.json({ message: 'Item atualizado com sucesso!', id: id, changes: result.rowCount });
    } catch (err) {
        console.error('Erro ao atualizar item:', err.message);
        res.status(500).json({ error: 'Erro ao atualizar item no banco de dados.' });
    }
});


// Rota para remover um item
app.delete('/api/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM items WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Item não encontrado.' });
        }
        res.json({ message: 'Item removido com sucesso!', id });
    } catch (err) {
        console.error('Erro ao remover item:', err.message);
        res.status(500).json({ error: 'Erro ao remover item do banco de dados.' });
    }
});


// Servir arquivos estáticos do Frontend
// Aponta para a pasta 'public' na raiz do projeto
app.use(express.static(path.join(__dirname, '../../public')));

// Iniciar o Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Frontend principal acessível em http://localhost:${PORT}/index.html`);
    console.log(`Página de preços acessível em http://localhost:${PORT}/prices.html`);
});
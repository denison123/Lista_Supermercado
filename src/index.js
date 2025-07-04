// src/index.js
const fs = require('fs'); // Para leitura/escrita de arquivos (persistência)
const path = require('path'); // Para resolver caminhos de arquivo
const readlineSync = require('readline-sync'); // Para entrada de usuário na CLI (se instalado)
const chalk = require('chalk'); // Para estilizar o console (se instalado)

// Caminho do arquivo onde a lista será salva
const filePath = path.join(__dirname, '../data/lista.json');

let listaDeCompras = [];

// --- Funções de Persistência ---
function carregarLista() {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            listaDeCompras = JSON.parse(data);
            console.log(chalk.green('Lista carregada com sucesso!'));
        } else {
            console.log(chalk.yellow('Arquivo de lista não encontrado. Começando com lista vazia.'));
            salvarLista(); // Cria o arquivo se não existir
        }
    } catch (error) {
        console.error(chalk.red('Erro ao carregar a lista:', error.message));
        listaDeCompras = []; // Garante que a lista esteja vazia em caso de erro
    }
}

function salvarLista() {
    try {
        const dataDir = path.dirname(filePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir); // Cria a pasta 'data' se não existir
        }
        fs.writeFileSync(filePath, JSON.stringify(listaDeCompras, null, 2), 'utf8');
        console.log(chalk.green('Lista salva com sucesso!'));
    } catch (error) {
        console.error(chalk.red('Erro ao salvar a lista:', error.message));
    }
}

// --- Funções da Calculadora ---
function adicionarItem() {
    const item = readlineSync.question(chalk.cyan('Qual item você deseja adicionar? '));
    if (item.trim() !== '') { // Verifica se o item não está vazio
        listaDeCompras.push(item.trim());
        console.log(chalk.green(`"${item.trim()}" adicionado à lista!`));
        salvarLista();
    } else {
        console.log(chalk.red('Nome do item não pode ser vazio.'));
    }
}

function removerItem() {
    if (listaDeCompras.length === 0) {
        console.log(chalk.yellow('A lista está vazia. Nada para remover.'));
        return;
    }

    listarItens(); // Mostra a lista para o usuário escolher
    const indiceStr = readlineSync.question(chalk.cyan('Qual o NÚMERO do item que você deseja remover? (Ou digite o nome completo) '));

    let itemRemovido = null;

    // Tenta remover por índice primeiro
    const indice = parseInt(indiceStr);
    if (!isNaN(indice) && indice > 0 && indice <= listaDeCompras.length) {
        itemRemovido = listaDeCompras.splice(indice - 1, 1)[0];
    } else {
        // Se não for um índice válido, tenta remover por nome
        const indexPorNome = listaDeCompras.indexOf(indiceStr.trim());
        if (indexPorNome !== -1) {
            itemRemovido = listaDeCompras.splice(indexPorNome, 1)[0];
        }
    }

    if (itemRemovido) {
        console.log(chalk.green(`"${itemRemovido}" removido da lista!`));
        salvarLista();
    } else {
        console.log(chalk.red('Item não encontrado na lista ou número inválido.'));
    }
}


function listarItens() {
    if (listaDeCompras.length === 0) {
        console.log(chalk.yellow('Sua lista de compras está vazia.'));
    } else {
        console.log(chalk.blue('\n--- Sua Lista de Compras ---'));
        listaDeCompras.forEach((item, index) => {
            console.log(chalk.white(`${index + 1}. ${item}`));
        });
        console.log(chalk.blue('---------------------------\n'));
    }
}

function limparLista() {
    if (listaDeCompras.length > 0) {
        const confirmacao = readlineSync.question(chalk.red('Tem certeza que deseja limpar toda a lista? (s/N) ')).toLowerCase();
        if (confirmacao === 's') {
            listaDeCompras = [];
            salvarLista();
            console.log(chalk.green('A lista foi limpa!'));
        } else {
            console.log(chalk.yellow('Operação de limpeza cancelada.'));
        }
    } else {
        console.log(chalk.yellow('A lista já está vazia.'));
    }
}

// --- Menu Principal da Aplicação ---
function exibirMenu() {
    console.log(chalk.magenta('\n--- Menu da Lista de Supermercado ---'));
    console.log(chalk.yellow('1. Adicionar item'));
    console.log(chalk.yellow('2. Remover item'));
    console.log(chalk.yellow('3. Listar itens'));
    console.log(chalk.yellow('4. Limpar lista'));
    console.log(chalk.yellow('5. Sair'));
    console.log(chalk.magenta('------------------------------------'));
}

function iniciarApp() {
    carregarLista(); // Carrega a lista ao iniciar
    let continuar = true;
    while (continuar) {
        exibirMenu();
        const opcao = readlineSync.question(chalk.green('Escolha uma opção: '));

        switch (opcao) {
            case '1':
                adicionarItem();
                break;
            case '2':
                removerItem();
                break;
            case '3':
                listarItens();
                break;
            case '4':
                limparLista();
                break;
            case '5':
                continuar = false;
                console.log(chalk.cyan('Saindo da aplicação. Até mais!'));
                break;
            default:
                console.log(chalk.red('Opção inválida. Por favor, escolha novamente.'));
        }
        readlineSync.keyInPause(chalk.gray('\nPressione qualquer tecla para continuar...'));
    }
}

// Inicia a aplicação
iniciarApp();
// public/js/app.js
    document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('itemInput');
    const quantityInput = document.getElementById('quantityInput');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemList = document.getElementById('itemList');
    // const clearListBtn = document.getElementById('clearListBtn'); // REMOVIDO: Referência ao botão

    const API_URL = 'https://lista-supermercado-backend.onrender.com/api/items';
                    

    // Função para carregar os itens da API
    async function loadItems() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const items = await response.json();
            renderItems(items);
        }
        catch (error) {
            console.error('Erro ao carregar itens:', error);
            alert('Erro ao carregar a lista de compras. Verifique se o servidor está rodando.');
        }
    }

    // Função para renderizar os itens na UI
    function renderItems(items) {
        itemList.innerHTML = '';
        if (items.length === 0) {
            itemList.innerHTML = '<p class="empty-list-message">Sua lista está vazia. Adicione alguns itens!</p>';
            // clearListBtn.style.display = 'none'; // REMOVIDO: Lógica de esconder o botão
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.quantity}x ${item.name}</span>
                    <button data-id="${item.id}">Remover</button>
                `;
                itemList.appendChild(li);
            });
            // clearListBtn.style.display = 'inline-block'; // REMOVIDO: Lógica de mostrar o botão
        }
    }

    // Função para adicionar um novo item
    async function addItem() {
        const itemName = itemInput.value.trim();
        const itemQuantity = parseInt(quantityInput.value);

        if (itemName === '') {
            alert('Por favor, digite o nome do item.');
            return;
        }
        if (isNaN(itemQuantity) || itemQuantity <= 0) {
            alert('Por favor, digite uma quantidade válida (número positivo).');
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: itemName, quantity: itemQuantity }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            itemInput.value = '';
            quantityInput.value = '1';
            loadItems();
        } catch (error) {
            console.error('Erro ao adicionar item:', error);
            alert(`Erro ao adicionar item: ${error.message}. Tente novamente mais tarde.`);
        }
    }

    // Função para remover um item
    async function removeItem(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            loadItems();
        } catch (error) {
            console.error('Erro ao remover item:', error);
            alert('Erro ao remover item. Tente novamente mais tarde.');
        }
    }

    // REMOVIDO: Função clearAllItems
    /*
    async function clearAllItems() {
        if (!confirm('Tem certeza que deseja limpar TODA a lista de supermercado? Esta ação é irreversível!')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/all`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            alert('Lista limpa com sucesso!');
            loadItems();
        } catch (error) {
            console.error('Erro ao limpar a lista:', error);
            alert('Erro ao limpar a lista. Tente novamente mais tarde.');
        }
    }
    */

    // Event Listeners
    addItemBtn.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });
    quantityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addItem();
        }
    });

    itemList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const itemId = e.target.dataset.id;
            if (confirm('Tem certeza que deseja remover este item?')) {
                removeItem(itemId);
            }
        }
    });

    // REMOVIDO: Event listener para o botão de limpar
    // clearListBtn.addEventListener('click', clearAllItems);

    // Carrega os itens ao iniciar
    loadItems();
});
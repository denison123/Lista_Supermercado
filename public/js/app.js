// public/js/app.js
document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('itemInput');
    const quantityInput = document.getElementById('quantityInput');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemList = document.getElementById('itemList');
    // const clearListBtn = document.getElementById('clearListBtn'); // Botão Limpar Lista removido anteriormente

    const API_URL = 'https://lista-supermercado-backend.onrender.com/api/items'; // Certifique-se de que esta URL está correta!

    // Função para carregar os itens da API
    async function loadItems() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message}`);
            }
            const items = await response.json();
            renderItems(items);
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            alert(`Erro ao carregar a lista de compras: ${error.message}. Verifique se o servidor está rodando.`);
        }
    }

    // Função para renderizar os itens na UI
    function renderItems(items) {
        itemList.innerHTML = '';
        if (items.length === 0) {
            itemList.innerHTML = '<p class="empty-list-message">Sua lista está vazia. Adicione alguns itens!</p>';
            // clearListBtn.style.display = 'none'; // Lógica de esconder o botão removida
        } else {
            items.forEach(item => {
                const li = document.createElement('li');
                li.dataset.id = item.id; // Armazena o ID do item no elemento li

                li.innerHTML = `
                    <span>${item.quantity}x ${item.name}</span>
                    <div class="remove-icon-wrapper" data-id="${item.id}">
                        <svg class="remove-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </div>
                `;
                itemList.appendChild(li);
            });
            // clearListBtn.style.display = 'inline-block'; // Lógica de mostrar o botão removida
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
            const response = await fetch(`${API_URL.replace('/api/items', `/api/items/${id}`)}`, { // Ajusta a URL para DELETE
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

    // Event listener para o ícone de remover
    itemList.addEventListener('click', (e) => {
        // Verifica se o clique foi no wrapper do ícone ou no próprio SVG/path
        const removeWrapper = e.target.closest('.remove-icon-wrapper');
        if (removeWrapper) {
            const itemId = removeWrapper.dataset.id;
            if (confirm('Tem certeza que deseja remover este item?')) {
                removeItem(itemId);
            }
        }
    });

    // Carrega os itens ao iniciar
    loadItems();
});

// public/js/prices_app.js
document.addEventListener('DOMContentLoaded', () => {
    const priceList = document.getElementById('priceList');
    const totalPriceSpan = document.getElementById('totalPrice');
    const API_URL = 'https://lista-supermercado-backend.onrender.com/api/items';

    let allItems = [];

    // Função para carregar os itens da API
    async function loadItemsForPrices() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allItems = await response.json();
            renderPriceList(allItems);
            calculateTotal();
        } catch (error) {
            console.error('Erro ao carregar itens para a lista de preços:', error);
            alert('Erro ao carregar a lista de preços. Verifique se o servidor está rodando.');
        }
    }

    // Função para renderizar a lista de itens com campos de preço
    function renderPriceList(items) {
        priceList.innerHTML = '';
        if (items.length === 0) {
            priceList.innerHTML = '<p class="empty-list-message">Nenhum item na lista. Adicione itens na página principal.</p>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;

            // O input type="number" usa ponto como separador decimal.
            // Para exibir o R$ na frente, vamos envolvê-lo em uma div
            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <div class="price-input-wrapper">
                    <span>R$</span> 
                    <input type="number" class="price-input" placeholder="0.00" step="0.01" min="0" value="${item.price || ''}">
                </div>
                <button class="save-price-btn">Salvar Preço</button>
            `;
            priceList.appendChild(li);
        });
    }

    // Função para calcular o total
    function calculateTotal() {
        let total = 0;
        allItems.forEach(item => {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            if (!isNaN(price) && !isNaN(quantity) && price >= 0 && quantity > 0) {
                total += price * quantity;
            }
        });
        // Formata o total para moeda Real Brasileira usando toLocaleString
        totalPriceSpan.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Função para salvar o preço de um item específico
    async function saveItemPrice(itemId, newPrice) {
        try {
            const response = await fetch(`${API_URL}/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ price: newPrice }),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            // Atualiza o item no array local 'allItems'
            const updatedItemIndex = allItems.findIndex(item => item.id === itemId);
            if (updatedItemIndex !== -1) {
                allItems[updatedItemIndex].price = newPrice;
            }
            calculateTotal(); // Recalcula o total após a atualização
            console.log(`Preço do item ${itemId} salvo: R$ ${newPrice.toFixed(2)}`);
        } catch (error) {
            console.error('Erro ao salvar preço do item:', error);
            alert(`Erro ao salvar preço: ${error.message}`);
        }
    }

    // Event Listeners
    priceList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('save-price-btn')) {
            const listItem = e.target.closest('li');
            const itemId = listItem.dataset.id;
            const priceInput = listItem.querySelector('.price-input');
            const newPrice = parseFloat(priceInput.value); 

            if (isNaN(newPrice) || newPrice < 0) {
                alert('Por favor, digite um preço válido (número positivo ou zero).');
                return;
            }
            await saveItemPrice(parseInt(itemId), newPrice);
        }
    });

    // Opcional: Salvar ao pressionar Enter no campo de preço
    priceList.addEventListener('keypress', async (e) => {
        if (e.target.classList.contains('price-input') && e.key === 'Enter') {
            const listItem = e.target.closest('li');
            const itemId = listItem.dataset.id;
            const newPrice = parseFloat(e.target.value);

            if (isNaN(newPrice) || newPrice < 0) {
                alert('Por favor, digite um preço válido (número positivo ou zero).');
                return;
            }
            await saveItemPrice(parseInt(itemId), newPrice);
        }
    });

    // Carrega os itens ao carregar a página
    loadItemsForPrices();
});
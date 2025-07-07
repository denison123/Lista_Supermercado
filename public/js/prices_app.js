// public/js/prices_app.js
document.addEventListener('DOMContentLoaded', () => {
    const priceList = document.getElementById('priceList');
    const totalPriceSpan = document.getElementById('totalPrice');
    const API_URL = 'https://lista-supermercado-backend.onrender.com/api/items'; // Certifique-se de que esta URL está correta!

    let allItems = [];

    // Função para carregar os itens da API
    async function loadItemsForPrices() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                // Tenta ler a mensagem de erro do corpo da resposta
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.message}`);
            }
            allItems = await response.json();
            renderPriceList(allItems);
            calculateTotal();
        } catch (error) {
            console.error('Erro ao carregar itens para a lista de preços:', error);
            alert(`Erro ao carregar a lista de preços: ${error.message}. Verifique se o servidor está rodando.`);
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

            li.innerHTML = `
                <span>${item.quantity}x ${item.name}</span>
                <div class="price-input-wrapper">
                    <span>R$</span> 
                    <input type="number" class="price-input" placeholder="0.00" step="0.01" min="0" value="${item.price || ''}">
                </div>
                <!-- Botão "Salvar Preço" REMOVIDO daqui -->
            `;
            priceList.appendChild(li);
        });
        // Adiciona event listeners aos novos inputs criados
        addEventListenersToPriceInputs();
    }

    // Função para adicionar event listeners aos campos de preço
    function addEventListenersToPriceInputs() {
        const priceInputs = document.querySelectorAll('.price-input');
        priceInputs.forEach(input => {
            // Salva ao perder o foco (blur)
            input.addEventListener('blur', async (e) => {
                const listItem = e.target.closest('li');
                const itemId = listItem.dataset.id;
                const newPrice = parseFloat(e.target.value);

                // Evita salvar se o valor não mudou ou é inválido
                const currentItem = allItems.find(item => item.id == itemId);
                if (currentItem && currentItem.price == newPrice && !isNaN(newPrice)) {
                    return; // Não faz nada se o preço não mudou
                }

                if (isNaN(newPrice) || newPrice < 0) {
                    // Opcional: alert('Por favor, digite um preço válido (número positivo ou zero).');
                    // Melhor apenas logar ou dar feedback visual sem alert intrusivo
                    console.warn('Preço inválido inserido, não salvando:', e.target.value);
                    return;
                }
                await saveItemPrice(parseInt(itemId), newPrice);
            });

            // Salva ao pressionar Enter
            input.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.target.blur(); // Força o blur para disparar o salvamento
                }
            });
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
        totalPriceSpan.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Função para salvar o preço de um item específico
    async function saveItemPrice(itemId, newPrice) {
        try {
            const response = await fetch(`${API_URL.replace('/api/items', `/api/items/${itemId}`)}`, { // Ajusta a URL para PUT
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
            const updatedItemIndex = allItems.findIndex(item => item.id == itemId); // Use == para comparar id e itemId (itemId pode ser int, item.id pode ser string)
            if (updatedItemIndex !== -1) {
                allItems[updatedItemIndex].price = newPrice;
            }
            calculateTotal(); // Recalcula o total após a atualização
            console.log(`Preço do item ${itemId} salvo: R$ ${newPrice.toFixed(2)}`);
        } catch (error) {
            console.error('Erro ao salvar preço do item:', error);
            // alert(`Erro ao salvar preço: ${error.message}`); // Evita alert intrusivo
        }
    }

    // REMOVIDO: Event Listener para o botão "Salvar Preço"
    /*
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
    */

    // REMOVIDO: Event Listener para Enter (agora tratado dentro de addEventListenersToPriceInputs)
    /*
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
    */

    // Carrega os itens ao carregar a página
    loadItemsForPrices();
});

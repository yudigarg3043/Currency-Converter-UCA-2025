const apiKey = "703459cf375a15b3773dbe4b";
const HISTORY_KEY = 'currencyHistory'; 
const FAVORITES_KEY = 'currencyFavorites';

const favoritePairs = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));

let historyRecords = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); 

document.getElementById("viewHistory").onclick = renderHistoryPanel;
document.getElementById("closeHistoryBtn").onclick = renderHistoryPanel;

document.getElementById("saveCurrencyBtn").onclick = toggleFavorite; 
document.getElementById("toggleFavorite").onclick = renderFavoritesPanel;
document.getElementById("closeFavoritesBtn").onclick = renderFavoritesPanel;

/**
 * Constructor Functions
 */
function HistoryRecord(amount, from, to, result, timestamp) {
    this.amount = amount;
    this.from = from;
    this.to = to;
    this.result = parseFloat(result);
    this.timestamp = timestamp || new Date().toISOString();
}

/**
 * Saves a new record to history and updates Local Storage.
 * CONCEPTS: Hoisting, Web Storage
 */
function saveHistory(amount, from, to, conversionResult) { 
    const newRecord = new HistoryRecord(amount, from, to, conversionResult);
    
    console.log("History saved:", newRecord);

    historyRecords.unshift(newRecord);
    
    if (historyRecords.length > 10) {
        historyRecords.pop();
    }
    
    // Web Storage: Persist the updated array
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyRecords));
}

// Swap functionality
document.getElementById("swap").onclick = () => {
    const fromInput = document.getElementById("fromCurr");
    const toInput = document.getElementById("toCurr");

    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
    
    document.getElementById("result-container").style.display = 'none';
};

// Reset functionality
document.getElementById("reset").onclick = () => {
    document.getElementById("amount").value = '';
    document.getElementById("fromCurr").value = '';
    document.getElementById("toCurr").value = '';
    document.getElementById("result-container").style.display = 'none';
    console.log("Inputs reset.");
};

function renderHistoryPanel() {
    const historyPanel = document.getElementById("history-panel");
    const historyList = document.getElementById("history-list-body");
    
    if (!historyPanel || !historyList) {
        console.error("History panel elements (history-panel or history-list) not found in DOM.");
        return;
    }
    
    historyPanel.style.display = (historyPanel.style.display === 'none' || historyPanel.style.display === '') ? 'block' : 'none';
    
    if (historyPanel.style.display === 'none') {
        return;
    }

    historyList.innerHTML = ''; // Clear previous content

    if (historyRecords.length === 0) {
        historyList.innerHTML = '<p class="text-secondary text-center">No conversion history yet.</p>';
        return;
    }

    historyRecords.forEach(record => {
        // Destructuring: Cleanly pull data from the HistoryRecord object
        const { amount, from, to, result, timestamp } = record;
        
        const date = new Date(timestamp).toLocaleTimeString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const historyItem = document.createElement('div');
        historyItem.className = 'd-flex justify-content-between p-2 my-1 rounded border border-secondary';
        
        historyItem.innerHTML = `
            <div>
                <span class="fw-bold">${amount} ${from}</span> <i class="fa-solid fa-arrow-right-long text-success mx-2"></i> 
                <span class="fw-bold text-warning">${result} ${to}</span>
            </div>
            <span class="text-secondary small ms-3">${date}</span>
        `;
        historyList.appendChild(historyItem);
    });
}


async function convertCurrency(fromCurrency, toCurrency, amount) {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        if (data.result === "success") {
            const rate = data.conversion_rate;
            const convertedAmount = (amount * rate).toFixed(2);
            
            // Save history on successful conversion
            saveHistory(amount, fromCurrency, toCurrency, convertedAmount);
            
            return convertedAmount;
        } else {
            throw new Error("API error: " + data["error-type"]);
        }
    } catch (error) {
        console.error("Error converting currency:", error);
        return null;
    }
}

document.getElementById("convert").onclick = () => {
    const amount = parseFloat(document.getElementById("amount").value);
    const fromCurr = document.getElementById("fromCurr").value.toUpperCase();
    const toCurr = document.getElementById("toCurr").value.toUpperCase();

    if (!fromCurr || !toCurr) {
        alert("⚠️ Please enter valid currencies."); return;
    }
    if (isNaN(amount) || amount <= 0) {
        alert("⚠️ Please enter a valid amount greater than zero."); return;
    }
    if (fromCurr === toCurr) {
        alert("⚠️ Source and target currencies must be different."); return;
    }

    document.getElementById("result-container").style.display = 'none';
    document.getElementById("converted-amount").textContent = 'Loading...';
    document.getElementById("original-query").textContent = '';

    const resultCard = document.querySelector('#result-container .card');
    const convertedAmountElement = document.getElementById("converted-amount");

    resultCard.className = 'card bg-dark text-white border-light shadow-lg';
    convertedAmountElement.classList.remove('text-danger'); 
    convertedAmountElement.classList.add('text-success'); 

    convertCurrency(fromCurr, toCurr, amount)
        .then(result => {
            if (result) {
                // Success State
                convertedAmountElement.textContent = `${result} ${toCurr}`;
                document.getElementById("original-query").textContent = `for ${amount} ${fromCurr}`;
                document.getElementById("result-container").style.display = 'flex';
                
                // Optional: Call market panel refresh from the other file (if implemented)
                if (typeof populateMarketPanel === 'function') populateMarketPanel(); 
            } else {
                // API Error State
                resultCard.className = 'card bg-danger text-white border-white shadow-lg';
                convertedAmountElement.classList.remove('text-success');
                convertedAmountElement.classList.add('text-white');
                document.getElementById("converted-amount").textContent = `Error during conversion.`;
                document.getElementById("original-query").textContent = `Please try again.`;
                document.getElementById("result-container").style.display = 'flex';
            }
        })
        .catch(err => {
            // Network Error State
            console.error(err);
            resultCard.className = 'card bg-danger text-white border-white shadow-lg';
            convertedAmountElement.classList.remove('text-success');
            convertedAmountElement.classList.add('text-white');
            document.getElementById("converted-amount").textContent = `Network Error.`;
            document.getElementById("original-query").textContent = `Could not reach API.`;
            document.getElementById("result-container").style.display = 'flex';
        });
};

function updateFavoriteIcon(fromCurr, toCurr) {
    const pair = `${fromCurr}/${toCurr}`;
    const heartIcon = document.getElementById("toggleFavoriteIcon");
    
    if (heartIcon) {
        if (favoritePairs.has(pair)) {
            // Favorited state: Solid heart, yellow/warning color
            heartIcon.classList.remove('fa-regular', 'text-white');
            heartIcon.classList.add('fa-solid', 'text-warning');
        } else {
            // Default state: Outline heart, white color
            heartIcon.classList.remove('fa-solid', 'text-warning');
            heartIcon.classList.add('fa-regular', 'text-white');
        }
    }
}

function toggleFavorite(event) {
    const fromCurr = document.getElementById("fromCurr").value.toUpperCase();
    const toCurr = document.getElementById("toCurr").value.toUpperCase();
    
    if (!fromCurr || !toCurr || fromCurr === toCurr) {
        alert("⚠️ Please enter a valid, different currency pair.");
        return;
    }
    
    const pair = `${fromCurr}/${toCurr}`;

    if (favoritePairs.has(pair)) {
        alert(`⚠️ ${pair} currency pair is already in your favorites.`);
    } else {
        favoritePairs.add(pair);
        console.log(`Added ${pair} to favorites.`);
    }

    // Web Storage: Persist the Set back to Local Storage
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoritePairs)));
    
    // Update the button icon immediately
    updateFavoriteIcon(fromCurr, toCurr);
    
    // Check if the call originated from the heart button (to show the popup)
    if (event && event.currentTarget.id === 'toggleFavorite') {
        renderFavoritesPanel();
    }
}

function renderFavoritesPanel() {
    const favoritesPanel = document.getElementById("favorites-panel");
    const favoritesList = document.getElementById("favorites-list-body");
    
    if (!favoritesPanel || !favoritesList) {
        console.error("Favorites panel elements not found in DOM.");
        return;
    }
    
    // Toggle visibility logic (used for both opening and closing)
    favoritesPanel.style.display = (favoritesPanel.style.display === 'none' || favoritesPanel.style.display === '') ? 'block' : 'none';
    
    if (favoritesPanel.style.display === 'none') {
        return;
    }

    favoritesList.innerHTML = ''; // Clear previous content
    
    if (favoritePairs.size === 0) {
        favoritesList.innerHTML = '<p class="text-secondary p-3 mb-0 text-center">No favorite pairs saved yet.</p>';
        return;
    }
    
    // Loops and Destructuring
    Array.from(favoritePairs).forEach(pair => {
        // Destructuring: Split the pair string into its components for display
        const [from, to] = pair.split('/'); 
        
        const listItem = document.createElement('div');
        listItem.className = 'd-flex justify-content-between align-items-center p-2 my-1 rounded border border-secondary';
        
        listItem.innerHTML = `
            <div>
                <span class="fw-bold">${from} / ${to}</span>
            </div>
            <button class="btn btn-sm btn-danger remove-favorite" data-pair="${pair}">Remove</button>
        `;
        favoritesList.appendChild(listItem);
    });
    
    // Add event listeners for new 'Remove' buttons
    favoritesList.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', (e) => {
            const pairToRemove = e.currentTarget.getAttribute('data-pair');
            
            // Remove from the Set and update storage
            favoritePairs.delete(pairToRemove);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoritePairs)));
            
            // Re-render the panel to update the list
            renderFavoritesPanel(); 
            // Also update the icon on the main form in case the pair was the current one
            updateFavoriteIcon(document.getElementById("fromCurr").value.toUpperCase(), document.getElementById("toCurr").value.toUpperCase());
        });
    });
}
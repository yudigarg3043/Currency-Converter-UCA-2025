const apiKey = "703459cf375a15b3773dbe4b";
const HISTORY_KEY = 'currencyHistory'; 

// Web Storage: Load history records, defaults to empty array
let historyRecords = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); 

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
    
    renderHistoryPanel(); 
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

/**
 * Renders the history records into the dedicated panel (assuming ID: history-panel).
 * CONCEPTS: Loops, Destructuring
 */
function renderHistoryPanel() {
    const historyPanel = document.getElementById("history-panel");
    const historyList = document.getElementById("history-list");
    
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

    // Loops and Destructuring
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

// Link history button (assuming ID: viewHistoryBtn)
document.getElementById("viewHistoryBtn").onclick = renderHistoryPanel;

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
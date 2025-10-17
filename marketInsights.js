const EXCHANGE_RATE_API_KEY = "703459cf375a15b3773dbe4b";
const EXCHANGE_RATE_BASE_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;
const MARKET_PAIRS_KEY = 'preferredMarketPairs';
const MAX_PREFERRED_PAIRS = 3;

const POLYGON_BASE_URL = "https://api.polygon.io/v2/aggs/ticker/";
const POLYGON_API_KEY = "M_kZ2mPocJ0aQ6GTOGZc3gohct3EDbgJ"; // Placeholder/Example Key (Must be real)

function loadPreferredPairsObject() {
    const savedString = localStorage.getItem(MARKET_PAIRS_KEY) || '{}';
    const pairsObject = JSON.parse(savedString);

    if (Object.keys(pairsObject).length === 0) {
        const defaultPairs = [
            { code: 'EUR/USD', longName: 'Euro / US Dollar' },
            { code: 'GBP/INR', longName: 'British Pound / Indian Rupee' },
            { code: 'CAD/INR', longName: 'Canadian Dollar / Indian Rupee' }
        ];
        defaultPairs.forEach(pair => { pairsObject[pair.code] = pair; });
    }
    return pairsObject;
}

function savePreferredPairsObject(pairsObject) {
    localStorage.setItem(MARKET_PAIRS_KEY, JSON.stringify(pairsObject));
}

function calculateChange(...prices) { 
    if (prices.length < 2) return 0;
    const [historical, current] = prices.slice(-2);
    if (historical === 0) return 0;
    return ((current - historical) / historical) * 100;
}

let preferredMarketPairsObject = loadPreferredPairsObject();

/**
 * Handles adding a new pair and enforcing the FIFO limit.
 * NOTE: Removal is handled directly by the modal's click listeners.
 */
function toggleMarketPairPreference(pairCode, longName) {
    let pairsArray = Object.values(preferredMarketPairsObject);

    // If pair already exists, we do NOTHING (the calling function handled the check/alert)
    if (preferredMarketPairsObject.hasOwnProperty(pairCode)) {
        // This block is only entered if the item is being explicitly added via the modal's input field
        // and we pass the check, but for general removal (e.g., failed item), the modal handles deletion.
        return; 
    }

    // CASE: New Pair is being ADDED (Add and enforce limit)
    if (pairsArray.length >= MAX_PREFERRED_PAIRS) {
        // FIFO Logic: Remove the oldest (first) pair
        const oldestPairCode = Object.keys(preferredMarketPairsObject)[0];
        
        delete preferredMarketPairsObject[oldestPairCode];
        console.warn(`Limit reached (${MAX_PREFERRED_PAIRS}). Removed oldest pair: ${oldestPairCode}`);
    }

    // Add the new pair
    preferredMarketPairsObject[pairCode] = { code: pairCode, longName: longName };
    console.log(`Added ${pairCode} to preferences.`);

    // Save the updated object and re-render the UI
    savePreferredPairsObject(preferredMarketPairsObject);
    populateMarketPanel(); 
}

// --- 2. CORE RENDERING FUNCTION ---

async function populateMarketPanel() {
    const newsContainer = document.getElementById('market-list'); 
    // CRITICAL: Slice the pairs list to respect the concurrency limit
    const pairsToFetch = Object.keys(preferredMarketPairsObject).slice(0, MAX_PREFERRED_PAIRS);
    
    newsContainer.innerHTML = '<p class="text-light text-center mt-3">Fetching live market data...</p>';

    const allFetches = pairsToFetch.map(code => {
        const pairDetail = preferredMarketPairsObject[code];
        const [from, to] = code.split('/');
        
        const currentUrl = `${EXCHANGE_RATE_BASE_URL}/pair/${from}/${to}`; 
        const polygonTicker = `C:${from}${to}`; 
        const historicalUrl = `${POLYGON_BASE_URL}${polygonTicker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

        return Promise.all([
            fetch(currentUrl).then(res => res.json()),
            fetch(historicalUrl).then(res => res.json())
        ])
        .then(([currentAPI_Data, historicalAPI_Data]) => {
            let historicalPrice;
            let currentPrice;
            
            if (currentAPI_Data.result === 'success') {
                currentPrice = currentAPI_Data.conversion_rate;
            } else {
                throw new Error(`Current Rate API failure: ${currentAPI_Data["error-type"]}`);
            }

            // Polygon.io Check: Check results array for historical close price ('c')
            if (historicalAPI_Data.results && historicalAPI_Data.results.length > 0) {
                historicalPrice = historicalAPI_Data.results[0].c;
            } else {
                throw new Error("Historical data failed to load.");
            }

            const changePercent = calculateChange(historicalPrice, currentPrice).toFixed(2); 
            
            return {
                code,
                longName: pairDetail.longName,
                price: currentPrice.toFixed(4),
                changePercent: changePercent,
                failed: false
            };
        })
        .catch(error => {
            console.error(`Fetch error for ${code}: ${error.message}`);
            return { code, longName: pairDetail.longName, failed: true };
        });
    });

    const marketData = await Promise.all(allFetches);
    
    // 3. Render Results
    newsContainer.innerHTML = '';
    
    const validData = marketData.filter(item => !item.failed);
    const failedData = marketData.filter(item => item.failed);

    validData.forEach(item => {
        const { code, longName, price, changePercent } = item;
        
        const change = parseFloat(changePercent);
        const colorClass = change >= 0 ? 'text-success' : 'text-danger';
        const sign = change >= 0 ? '+' : '';
        
        const itemDiv = document.createElement('div');
        // NOTE: Removed 'bg-dark' to rely on CSS background setting
        itemDiv.className = 'd-flex justify-content-between align-items-center p-2 my-2 rounded-3 border border-secondary market-item'; 
        
        itemDiv.innerHTML = `
            <div>
                <span class="text-white fw-bold">${code}</span>
                <p class="text-secondary small mb-0">${longName}</p>
            </div>
            <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-warning me-2 toggle-market-btn" 
                        data-pair="${code}" data-name="${longName}">
                    ★
                </button>
                <div class="text-end">
                    <span class="${colorClass} fw-bold small">${sign}${changePercent}%</span>
                    <p class="text-white mb-0">${price}</p>
                </div>
            </div>
        `;
        newsContainer.appendChild(itemDiv);
    });

    // Render failed data
    failedData.forEach(item => {
        const itemDiv = document.createElement('div');
        // Use custom dark red background for error card and muted text
        itemDiv.className = 'd-flex justify-content-between p-2 my-1 rounded border border-danger text-danger small';
        itemDiv.style.backgroundColor = '#301A1A'; // Dark muted error background
        
        itemDiv.innerHTML = `<span>${item.code} load failed.</span>
            <button class="btn btn-sm btn-outline-danger toggle-market-btn" 
                    data-pair="${item.code}" data-name="${item.longName}">
                Remove
            </button>`;
        newsContainer.appendChild(itemDiv);
    });
    
    if (pairsToFetch.length === 0) {
        newsContainer.innerHTML = '<p class="text-info text-center mt-3">Use the "Manage List" button to add a pair!</p>';
    }

    // Attach event listeners for the remove/star buttons on the main panel
    document.querySelectorAll('#market-list .toggle-market-btn').forEach(button => {
        button.onclick = (event) => {
            const pairCode = event.currentTarget.getAttribute('data-pair');
            const longName = event.currentTarget.getAttribute('data-name');
            
            // This is primarily the REMOVE action when clicked on the main panel
            // Since it exists, we delete it.
            delete preferredMarketPairsObject[pairCode];
            savePreferredPairsObject(preferredMarketPairsObject);
            populateMarketPanel(); 
        };
    });
}


// --- 3. MODAL MANAGEMENT ---

function renderManagePairsModal() {
    const display = document.getElementById('currentPairsDisplay');
    display.innerHTML = ''; 
    const pairsArray = Object.values(preferredMarketPairsObject);

    if (pairsArray.length === 0) {
        display.innerHTML = '<span class="text-danger">List is empty. Add a pair above!</span>';
        return;
    }

    pairsArray.forEach(pair => {
        const tag = document.createElement('span');
        tag.className = 'badge text-dark me-2 p-2 remove-tag';
        tag.style.backgroundColor = '#7fefe2'; // Cyan/Mint accent color
        tag.textContent = `${pair.code} (Remove)`;
        tag.setAttribute('data-pair', pair.code);
        tag.style.cursor = 'pointer';

        // Event: Direct removal when clicking the tag inside the modal
        tag.onclick = (event) => {
            const pairToRemove = event.target.getAttribute('data-pair');
            
            delete preferredMarketPairsObject[pairToRemove];
            savePreferredPairsObject(preferredMarketPairsObject);
            
            renderManagePairsModal(); // Update modal
            populateMarketPanel();    // Update main panel
        };
        display.appendChild(tag);
    });
}

document.getElementById('addCustomPairBtn').onclick = () => {
    const input = document.getElementById('newPairInput');
    const pairCode = input.value.toUpperCase().trim();
    
    if (pairCode.length === 7 && pairCode.includes('/')) {
        const [from, to] = pairCode.split('/');
        
        if (from.length !== 3 || to.length !== 3) {
            alert('Currencies must be 3 letters (e.g., USD/EUR).');
            return;
        }

        // CRITICAL CHECK: Alert if the pair is already saved
        if (preferredMarketPairsObject.hasOwnProperty(pairCode)) {
            alert(`⚠️ ${pairCode} is already in your list.`);
            return; 
        }

        const longName = `${from} / ${to}`; 
        
        // Add pair and handle FIFO logic
        toggleMarketPairPreference(pairCode, longName); 
        
        input.value = '';
        renderManagePairsModal();
    } else {
        alert('⚠️ Please enter a valid currency pair format (e.g., USD/EUR).');
    }
};

document.getElementById('manageMarketPairsBtn').onclick = renderManagePairsModal;

populateMarketPanel();
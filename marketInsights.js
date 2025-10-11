const EXCHANGE_RATE_API_KEY = "703459cf375a15b3773dbe4b";
const EXCHANGE_RATE_BASE_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;
const MARKET_PAIRS_KEY = 'preferredMarketPairs';
const API_CONCURRENT_LIMIT = 3;

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

function toggleMarketPairPreference(pairCode, longName) {
    let pairsArray = Object.values(preferredMarketPairsObject);

    if (preferredMarketPairsObject.hasOwnProperty(pairCode)) {
        // CASE 1: Pair is ALREADY SAVED
        alert(`${pairCode} already in preferences.`);
        
    } else {
        // CASE 2: New Pair is being ADDED
        if (pairsArray.length >= API_CONCURRENT_LIMIT) {
            // FIFO Logic: Identify the oldest (first) pair in the object and remove it.
            const oldestPairCode = Object.keys(preferredMarketPairsObject)[0];
            
            delete preferredMarketPairsObject[oldestPairCode];
            console.warn(`Limit reached (${MAX_PREFERRED_PAIRS}). Removed oldest pair: ${oldestPairCode}`);
        }

        preferredMarketPairsObject[pairCode] = { code: pairCode, longName: longName };
        console.log(`Added ${pairCode} to preferences.`);
    }

    savePreferredPairsObject(preferredMarketPairsObject);
    populateMarketPanel(); 
}

async function populateMarketPanel() {
    const newsContainer = document.getElementById('market-list'); 
    const pairsToFetch = Object.keys(preferredMarketPairsObject).slice(0, API_CONCURRENT_LIMIT);
    
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
    
    newsContainer.innerHTML = '';
    
    const validData = marketData.filter(item => !item.failed);
    const failedData = marketData.filter(item => item.failed);

    validData.forEach(item => {
        const { code, longName, price, changePercent } = item;
        
        const change = parseFloat(changePercent);
        const colorClass = change >= 0 ? 'text-success' : 'text-danger';
        const sign = change >= 0 ? '+' : '';
        
        const itemDiv = document.createElement('div');
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

    failedData.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'd-flex justify-content-between p-2 my-1 rounded border border-danger text-danger small';
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

    document.querySelectorAll('#market-list .toggle-market-btn').forEach(button => {
        button.onclick = (event) => {
            const pairCode = event.currentTarget.getAttribute('data-pair');
            const longName = event.currentTarget.getAttribute('data-name');
            toggleMarketPairPreference(pairCode, longName); 
        };
    });
}


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
        tag.className = 'badge bg-warning text-dark me-2 p-2 remove-tag';
        tag.textContent = `${pair.code} (Remove)`;
        tag.setAttribute('data-pair', pair.code);
        tag.style.cursor = 'pointer';

        tag.onclick = (event) => {
            const pairCode = event.target.getAttribute('data-pair');
            toggleMarketPairPreference(pairCode, pair.longName);
            renderManagePairsModal();
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

        const longName = `${from} / ${to}`; 
        toggleMarketPairPreference(pairCode, longName); 
        input.value = '';
        renderManagePairsModal();
    } else {
        alert('⚠️ Please enter a valid currency pair format (e.g., USD/EUR).');
    }
};

document.getElementById('manageMarketPairsBtn').onclick = renderManagePairsModal;

populateMarketPanel();
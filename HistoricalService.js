// ====================================================================
// COMPLETE HISTORICAL DATA SCRIPT (history.js) - POLYGON EXCLUSIVE
// ====================================================================

// --- 1. CONFIGURATION AND SERVICE CLASSES ---
const POLYGON_BASE_URL = 'https://api.polygon.io/v2/';
const POLYGON_API_KEY = 'M_kZ2mPocJ0aQ6GTOGZc3gohct3EDbgJ';

/**
 * BaseService: Handles generic API fetching.
 * Only uses Polygon credentials set in the HistoricalRateService constructor.
 */
class BaseService {
    
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /**
     * Protected method for making authenticated API calls.
     */
    async _fetch(endpoint) {
        const url = `${this.baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${this.apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                const data = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`API error! Status: ${response.status}. Type: ${data.message || data['error-type']}`);
            }
            return await response.json();
        } catch (error) {
            console.error("API Fetch Failed:", error);
            return null;
        }
    }
}

/**
 * HistoricalRateService: Inherits from BaseService.
 * All methods now enforce the use of Polygon.io credentials.
 */
class HistoricalRateService extends BaseService {
    
    _formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Fetches a series of historical rates for the last 7 days dynamically.
     */
    async fetchTimeHistory(from, to, days = 7) {
        // Enforce Polygon credentials
        this.baseUrl = POLYGON_BASE_URL;
        this.apiKey = POLYGON_API_KEY;

        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - days);
        
        const start_date_str = this._formatDate(startDate);
        const end_date_str = this._formatDate(today);
        
        const ticker = `C:${from}${to}`;
        
        const endpoint = `aggs/ticker/${ticker}/range/1/day/${start_date_str}/${end_date_str}?adjusted=true&sort=asc&limit=${days}`; 
        
        const data = await this._fetch(endpoint);

        if (data && data.results && data.results.length > 0) {
            return data.results.map(day => ({
                date: this._formatDate(new Date(day.t)), 
                rate: day.c 
            }));
        }

        console.error(`Failed to fetch 7-day history for ${from}/${to}.`);
        return [];
    }

    /**
     * Fetches the closing price for a single past date (Polygon).
     */
    async fetchRateForDate(from, to, date) {
        // Enforce Polygon credentials
        this.baseUrl = POLYGON_BASE_URL;
        this.apiKey = POLYGON_API_KEY;
        
        const lookupDate = date; 
        const ticker = `C:${from}${to}`;
        
        // Polygon endpoint structure for a single day's closing price
        const endpoint = `aggs/ticker/${ticker}/range/1/day/${lookupDate}/${lookupDate}?adjusted=true&sort=asc&limit=1`;
        
        const data = await this._fetch(endpoint);

        if (data && data.results && data.results.length > 0) {
            return data.results[0].c; 
        }
        
        console.error(`Data not found for ${from}/${to} on ${date} via Polygon.`);
        return null;
    }
}

// Global service instance
const historicalService = new HistoricalRateService(
    POLYGON_API_KEY, 
    POLYGON_BASE_URL // Initial values are now Polygon's
);

// Global chart state
let historicalChartInstance = null; 


// ====================================================================
// SECTION 2: PAGE LOGIC AND EVENT HANDLERS
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const historyAnalyser = historicalService; 

    const graphPairDisplay = document.getElementById('graphPairDisplay');
    const graphFromCurrInput = document.getElementById('graphFromCurr');
    const graphToCurrInput = document.getElementById('graphToCurr');
    const chartArea = document.getElementById('historicalChart');
    const chartCanvas = document.getElementById('historicalChartCanvas');

    // Function to initiate the graph update
    const updateGraph = async (from, to) => {
        if (!from || !to) return;
        graphPairDisplay.textContent = `${from}/${to}`;
        
        chartArea.innerHTML = `<p class="text-info text-center pt-5">Fetching 7-day trend for ${from}/${to}...</p>`;

        const rawData = await historyAnalyser.fetchTimeHistory(from, to, 7);
        
        if (rawData && rawData.length > 0) {
            
            if (historicalChartInstance) {
                historicalChartInstance.destroy();
            }
            
            const ctx = chartCanvas.getContext('2d');

            if (typeof Chart !== 'undefined' && ctx) {
                const labels = rawData.map(d => d.date);
                const rates = rawData.map(d => d.rate);
                
                chartArea.innerHTML = ''; 
                chartArea.appendChild(chartCanvas);
                
                historicalChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `${from}/${to} Exchange Rate`,
                            data: rates,
                            borderColor: '#87CEFA', 
                            backgroundColor: 'rgba(135, 206, 250, 0.2)',
                            tension: 0.3,
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: 'white' }, grid: { color: '#333' } },
                            y: { ticks: { color: 'white' }, grid: { color: '#333' } }
                        },
                        plugins: {
                            legend: { labels: { color: 'white' } },
                            title: { display: false }
                        }
                    }
                });
            } else {
                chartArea.innerHTML = `<p class="text-danger text-center pt-5">Chart rendering failed: Chart.js library or canvas context not ready.</p>`;
            }
        } else {
            chartArea.innerHTML = `<p class="text-danger text-center pt-5">Failed to load 7-day trend. (API limit reached or invalid pair)</p>`;
        }
    };

    // --- 1. Graph Control Form Handler ---
    document.getElementById('graphControlForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const from = graphFromCurrInput.value.toUpperCase();
        const to = graphToCurrInput.value.toUpperCase();
        
        if (from.length === 3 && to.length === 3) {
            updateGraph(from, to);
        } else {
            alert("Please enter valid 3-letter currency codes for the graph.");
        }
    });

    // --- 2. Single Date Lookup Form Handler ---
    document.getElementById('dateLookupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const from = document.getElementById('dateFromCurr').value.toUpperCase();
        const to = document.getElementById('dateToCurr').value.toUpperCase();
        const date = document.getElementById('historicalDate').value;
        
        const resultContainer = document.getElementById('dateRateResult');
        const rateDisplay = document.getElementById('rateDisplay');

        if (!from || !to || !date) return alert("Please fill all fields.");

        rateDisplay.textContent = 'Fetching...';
        resultContainer.style.display = 'block';

        const rate = await historyAnalyser.fetchRateForDate(from, to, date);

        if (rate) {
            rateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
            rateDisplay.className = 'text-success mb-0 fw-bold';
        } else {
            rateDisplay.textContent = `Data not available for ${from}/${to} on ${date}. (Check console for API errors)`;
            rateDisplay.className = 'text-danger mb-0 fw-bold';
        }
    });

    // Initial load: Set the initial graph data using the default input values
    updateGraph(graphFromCurrInput.value.toUpperCase(), graphToCurrInput.value.toUpperCase());
});
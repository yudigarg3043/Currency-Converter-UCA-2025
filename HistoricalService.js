// ====================================================================
// File: HistoricalService.js (FINAL CODE)
// CONCEPTS: Classes, Prototypical Inheritance, Private Fields
// ====================================================================

const EXCHANGE_RATE_BASE_URL = 'https://v6.exchangerate-api.com/v6/';
const EXCHANGE_RATE_API_KEY = '703459cf375a15b3773dbe4b'; 
const POLYGON_BASE_URL = 'https://api.polygon.io/v2/';
const POLYGON_API_KEY = 'M_kZ2mPocJ0aQ6GTOGZc3gohct3EDbgJ'; // Placeholder/Example Key

/**
 * BaseService: Handles generic API configuration and fetching.
 */
class BaseService {
    
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey; // Standard property (accessible by child classes)
        this.baseUrl = baseUrl;
    }

    /**
     * Protected method for making authenticated API calls.
     */
    async _fetch(endpoint) {
        // Uses the current class instance's apiKey and baseUrl
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
 * HistoricalRateService: Inherits from BaseService, specializing in time-series data.
 * CONCEPTS: Prototypical Inheritance
 */
class HistoricalRateService extends BaseService {
    
    _formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    /**
     * Fetches a series of historical rates for the last 7 days dynamically (Polygon).
     */
    async fetchTimeHistory(from, to, days = 7) {
        // Use the Polygon API for time series data (overrides inherited properties)
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
     * Fetches the closing price for a single past date (ExchangeRate-API).
     */
    async fetchRateForDate(from, to, date) {
        // Use the ExchangeRate-API for single date lookup (overrides inherited properties)
        this.baseUrl = EXCHANGE_RATE_BASE_URL;
        this.apiKey = EXCHANGE_RATE_API_KEY;
        
        const [Y, M, D] = date.split('-');
        const endpoint = `history/${from}/${Y}/${M}/${D}`; 
        
        const data = await this._fetch(endpoint);

        if (data && data.result === 'success') {
            return data.conversion_rates[to];
        }
        return null;
    }
}

// Global service instance
const historicalService = new HistoricalRateService(
    EXCHANGE_RATE_API_KEY, 
    EXCHANGE_RATE_BASE_URL
);
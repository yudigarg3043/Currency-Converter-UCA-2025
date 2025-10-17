    // ====================================================================
    // CONFIGURATION AND CONSTANTS
    // ====================================================================

    // NOTE: This API key is visible and is for demonstration.
    const POLYGON_NEWS_API_URL = 'https://api.polygon.io/v2/reference/news?apiKey=iDsE4z4NqkGXpcp8pwNVdAkZZwOL3YYL';
    const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const SPEED_PX_PER_SEC = 24; // vertical scroll speed

    // ELEMENTS
    const ticker = document.getElementById('ticker');
    const newsList = document.getElementById('newsList');

    // STATE
    let items = [];
    let lastFrameTime = null;

    // ====================================================================
    // UTILITIES (Integrating Remaining Concepts)
    // ====================================================================

    /**
     * Simple logger class to demonstrate Function/Method Chaining.
     */
    const logger = {
        log: function(message) { console.log(`[LOG] ${message}`); return this; },
        warn: function(message) { console.warn(`[WARN] ${message}`); return this; }
    };

    /**
     * Demo fallback news using Spread Operator for safe copying.
     */
    function demoNews() {
      // CONCEPTS: Spread and Rest Operators (used to safely copy and augment data)
      const baseArticles = [
        { id: 'demo-1', title: 'Demo: Financial News is Loading', url: '#', image: 'https://via.placeholder.com/40/333/FFF?text=D1' },
        { id: 'demo-2', title: 'Demo: Check Your API Key', url: '#', image: 'https://via.placeholder.com/40/333/FFF?text=D2' },
        { id: 'demo-3', title: 'Demo: Auto-Scrolling Active', url: '#', image: 'https://via.placeholder.com/40/333/FFF?text=D3' },
      ];
      // Use Spread Operator to create a new array from the base array
      return [...baseArticles]; 
    }

    // Escape HTML safely
    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // ====================================================================
    // FETCHING AND RENDERING
    // ====================================================================

    // Fetch news from API
    async function fetchNews() {
      // CONCEPTS: Promises, Fetch, Async/Await, Event Loop
      try {
        const res = await fetch(POLYGON_NEWS_API_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Network error! Status: ${res.status}`);
        const data = await res.json();

        // Polygon.io format: articles are in the 'results' array
        const articles = (data.results || []).map((a, i) => ({
          id: a.id || i,
          title: a.title,
          url: a.article_url, // Use article_url as hyperlink
          image: a.image_url,
        }));

        logger.log(`Fetched ${articles.length} new articles.`).log(articles[0].title); // Function/Method Chaining
        return articles.length ? articles : demoNews();
      } catch (err) {
        logger.warn("Error fetching news:").warn(err.message);
        return demoNews();
      }
    }

    // Render items + duplicate for infinite loop
    function renderItems(list) {
      newsList.innerHTML = '';

      // Create a list containing the original items followed by a clone (for seamless loop)
      const fullList = [...list, ...list]; // CONCEPTS: Spread Operator

      // CONCEPTS: Loops
      fullList.forEach(item => {
        const li = document.createElement('li');
        li.className = 'news-item d-flex align-items-start'; // Use Bootstrap flex for layout
        
        // Structure: Image (40px) | Title (Hyperlink)
        const content = `
          <img src="${item.image || 'https://via.placeholder.com/40/000/FFF?text=N'}" 
               alt="" 
               class="rounded me-3" 
               style="width: 50px; height: 50px; object-fit: cover;">
          <a href="${item.url || '#'}" 
             target="_blank" 
             class="text-decoration-none text-white flex-grow-1"
             style="font-size: 0.9rem;">
            ${escapeHtml(item.title)}
          </a>
        `;
        
        li.innerHTML = content;
        newsList.appendChild(li);
      });
    }

    // Infinite vertical scroll animation
    function animate(time) {
      if (!lastFrameTime) lastFrameTime = time;
      const delta = (time - lastFrameTime) / 1000;
      lastFrameTime = time;

      ticker.scrollTop += SPEED_PX_PER_SEC * delta;

      const halfHeight = newsList.scrollHeight / 2;
      if (ticker.scrollTop >= halfHeight) {
        ticker.scrollTop -= halfHeight; // loop back seamlessly
      }

      requestAnimationFrame(animate);
    }

    // Poll new news and update
    async function pollAndUpdate() {
      const newItems = await fetchNews();
      if (JSON.stringify(newItems) !== JSON.stringify(items)) {
        items = newItems;
        renderItems(items);
        logger.log("News list updated.");
      }
    }

    // Init
    (async function init() {
      items = await fetchNews();
      renderItems(items);
      requestAnimationFrame(animate);
      setInterval(pollAndUpdate, POLL_INTERVAL_MS);
    })();
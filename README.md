# Currency-Converter-UCA-2025

***

# 🌐 Comprehensive Currency & Crypto Converter

This project is a multi-page web application built with **Vanilla JavaScript** and **Bootstrap 5**, designed to demonstrate proficiency across a broad spectrum of modern frontend development concepts. It provides robust real-time and historical conversion services for both Fiat and Cryptocurrency markets.

---

## ✨ Key Features & Functionality

| Feature | Description | JS Concept Highlighted |
| :--- | :--- | :--- |
| **Multi-Page App** | Separated UI logic into four specialized pages (Fiat, Fiat History, Crypto, Crypto History). | Architecture & Code Segregation |
| **Persistent History** | Saves the last 10 conversions locally, viewable via a dedicated popup. | **Constructor Functions**, **Hoisting**, **Web Storage** |
| **Favorites Management** | Users can save/remove favorite pairs. | **Sets** (for uniqueness), **Web Storage** |
| **Market Insights Panel** | Displays dynamic rate changes and manages a user-defined list (FIFO queue of 3 pairs). | **Promises**, **Objects** (FIFO logic), **Concurrency Management** |
| **Historical Analysis** | Dedicated page for fetching and visualizing time-series data. | **Classes**, **Inheritance**, **Chart.js** |
| **API Integration** | Uses **ExchangeRate-API** for Fiat, **CryptoCompare** for Crypto conversion, and **Polygon.io** for historical/chart data. | `async/await`, `Fetch` |

---

## 💻 Technical Concept Checklist

This project fulfills all required technical objectives across the codebase:

| Concept | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Classes & Inheritance** | Integrated | `HistoricalRateService` extends `BaseService` (`HistoricalService.js`). |
| **Constructor Functions** | Integrated | Used to model structured `HistoryRecord` objects. |
| **Promises & Async/Await** | Integrated | Used in all data fetching methods (`convertCurrency`, `populateMarketPanel`). |
| **Web Storage & Sets** | Integrated | Used for persisting history (`localStorage`) and managing `favoritePairs` (`Set`). |
| **Destructuring & Loops** | Integrated | Used extensively for rendering History and Market panels (`const { amount, from } = record;`). |
| **Spread and Rest Operators**| Integrated | Used in utility functions and when managing array/object mutations. |
| **Hoisting** | Integrated | Demonstrated via `function declaration` for `saveHistory`. |

---

## ⚙️ Setup and Installation

This project requires no complex build process.

### File Structure

| File | Primary Function |
| :--- | :--- |
| **`index.html`** | Main Fiat Converter UI. |
| **`crypto.html`** | Main Crypto Converter UI. |
| **`history.html`** | Historical Data/Graphing Page. |
| **`script.js`** | Fiat conversion, History, and Favorites logic. |
| **`crypto.js`** | Crypto conversion, History, and Favorites logic. |
| **`marketInsights.js`**| Logic for the dynamic Market Insights panel (shared visualization). |
| **`HistoricalService.js`**| Class definitions for historical data fetching. |

### External DependenciesaThat's great! Adding the live demo link makes your project submission complete.

Here is the final, complete content for your `README.md` file, including the link to view your live website.

***

# 🌐 Comprehensive Currency & Crypto Converter

This project is a multi-page web application built with **Vanilla JavaScript** and **Bootstrap 5**, designed to demonstrate proficiency across a broad spectrum of modern frontend development concepts. It provides robust real-time and historical conversion services for both Fiat and Cryptocurrency markets.

---

## 🚀 Live Demo

You can view the live, hosted version of the application here:

👉 **[View Website Live](https://yudigarg3043.github.io/Currency-Converter-UCA-2025/)**

---

## ✨ Key Features & Functionality

| Feature | Description | JS Concept Highlighted |
| :--- | :--- | :--- |
| **Persistent History** | Saves the last 10 conversions to local storage, viewable via a dedicated popup. | **Constructor Functions**, **Hoisting**, **Web Storage** |
| **Favorites Management** | Allows users to save preferred currency pairs for quick access. | **Sets** (for uniqueness), **Web Storage** |
| **Market Insights Panel** | Displays dynamic rate changes and manages a user-defined list with a **FIFO (First-In, First-Out)** limit of 3 pairs. | **Promises**, **Objects** (FIFO logic), **Concurrency Management** |
| **Historical Analysis** | Dedicated page for fetching and visualizing time-series data. | **Classes**, **Inheritance**, **Chart.js** |
| **Fiat & Crypto Converters** | Separate pages with optimized logic for Fiat (ExchangeRate-API) and Crypto (CryptoCompare, Polygon.io) conversions. | `async/await`, `Fetch` |

---

## 💻 Technical Concept Checklist

This project fulfills all required technical objectives across the codebase:

| Concept | Status | Implementation Detail |
| :--- | :--- | :--- |
| **Classes & Inheritance** | Integrated | `HistoricalRateService` extends `BaseService` (`HistoricalService.js`). |
| **Constructor Functions** | Integrated | Used to model structured `HistoryRecord` objects. |
| **Promises & Async/Await**| Integrated | Used in all data fetching methods (`convertCurrency`, `populateMarketPanel`). |
| **Destructuring & Loops** | Integrated | Used for rendering History and Market panels (`const { amount, from } = record;`). |
| **Spread and Rest Operators**| Integrated | Used in utility functions and when managing array/object mutations. |
| **Hoisting** | Integrated | Demonstrated via `function declaration` for `saveHistory`. |

---

## ⚙️ Setup and Installation

This project requires no complex build process.

### File Structure

| File | Primary Function |
| :--- | :--- |
| **`index.html`** | Main Fiat Converter UI. |
| **`crypto.html`** | Main Crypto Converter UI. |
| **`history.html`** | Historical Data/Graphing Page. |
| **`script.js`** | Fiat conversion, History, and Favorites logic. |
| **`crypto.js`** | Crypto conversion, History, and Favorites logic. |
| **`HistoricalService.js`**| Class definitions for historical data fetching. |

### External Dependencies

* **Bootstrap 5.3:** For styling and responsiveness.
* **Chart.js (CDN):** For rendering the visual line graphs on `history.html`.
* **Font Awesome:** For icons.

---

*Developed by Yudhish Garg*
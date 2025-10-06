const apiKey = "703459cf375a15b3773dbe4b";

async function convertCurrency(fromCurrency, toCurrency, amount) {
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();

    if (data.result === "success") {
      const rate = data.conversion_rate;
      const convertedAmount = (amount * rate).toFixed(2);
      console.log(`${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`);
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

    if (!amount || !fromCurr || !toCurr) {
        console.error("⚠️ Please enter valid amount and currencies.");
        return;
    }

    // Reset visibility and content before starting
    document.getElementById("result-container").style.display = 'none';
    document.getElementById("converted-amount").textContent = 'Loading...';
    document.getElementById("original-query").textContent = '';

    // Get a reference to the card element for easy style manipulation
    const resultCard = document.querySelector('#result-container .card');
    const convertedAmountElement = document.getElementById("converted-amount");

    // Reset card to default success state (bg-dark, text-success) before conversion
    resultCard.className = 'card bg-dark text-white border-light shadow-lg';
    convertedAmountElement.classList.remove('text-danger'); // Remove old error class if present
    convertedAmountElement.classList.add('text-success'); // Ensure success color is set for loading

    convertCurrency(fromCurr, toCurr, amount)
        .then(result => {
            if (result) {
                console.log("Converted value:", result);

                // Success State: The card is already styled for success (bg-dark, text-success)

                // 1. Set the large converted amount
                convertedAmountElement.textContent = `${result} ${toCurr}`;

                // 2. Set the smaller original query
                document.getElementById("original-query").textContent = `for ${amount} ${fromCurr}`;

                // 3. Show the result container
                document.getElementById("result-container").style.display = 'flex';
            } else {
                // API Error State
                resultCard.className = 'card bg-danger text-white border-white shadow-lg'; // Change card to danger/red
                convertedAmountElement.classList.remove('text-success');
                convertedAmountElement.classList.add('text-white'); // Use white text for contrast on red background

                document.getElementById("converted-amount").textContent = `Error during conversion.`;
                document.getElementById("original-query").textContent = `Please try again.`;
                document.getElementById("result-container").style.display = 'flex';
            }
        })
        .catch(err => {
            // Network/Fetch Error State
            console.error(err);

            resultCard.className = 'card bg-danger text-white border-white shadow-lg'; // Change card to danger/red
            convertedAmountElement.classList.remove('text-success');
            convertedAmountElement.classList.add('text-white'); // Use white text for contrast on red background

            document.getElementById("converted-amount").textContent = `Network Error.`;
            document.getElementById("original-query").textContent = `Could not reach API.`;
            document.getElementById("result-container").style.display = 'flex';
        });
};
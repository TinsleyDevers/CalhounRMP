// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  // Load options page content
  fetch("options.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("options").innerHTML = html;
      const optionsScript = document.createElement("script");
      optionsScript.src = "options.js";
      document.body.appendChild(optionsScript);
    });

  // Load search page content
  fetch("search.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("search").innerHTML = html;
      document
        .getElementById("search-button")
        .addEventListener("click", handleSearch);
    });

  // Handle tab switching
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.dataset.tab;

      // Reset all tabs
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => (content.style.display = "none"));

      // Activate selected tab
      button.classList.add("active");
      document.getElementById(tabName).style.display = "block";
    });
  });
});

// Handle professor search
function handleSearch() {
  const professorName = document.getElementById("prof-name-input").value;
  const resultsContainer = document.getElementById("search-results-container");

  if (!professorName.trim()) {
    resultsContainer.innerHTML =
      '<div class="result-card"><p>Please enter a professor\'s name.</p></div>';
    return;
  }

  resultsContainer.innerHTML =
    '<div class="result-card"><p>Loading...</p></div>';

  chrome.runtime.sendMessage(
    { type: "getRating", professorName },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("RMP Extension Error:", chrome.runtime.lastError.message);
        resultsContainer.innerHTML =
          '<div class="result-card"><p>An error occurred.</p></div>';
        return;
      }
      displaySearchResults(response, professorName);
    }
  );
}

// Display search results in the popup
function displaySearchResults(data, professorName) {
  const resultsContainer = document.getElementById("search-results-container");
  const formattedName = toTitleCase(professorName);
  let content = '<div class="result-card">';

  if (data.rating === "Not Found" || data.rating === "Error") {
    content += `<h3>${formattedName}</h3><p>Professor not found. <a href="${data.url}" target="_blank">Try searching on RateMyProfessors.com</a></p>`;
  } else {
    content += `<h3><a href="${data.url}" target="_blank">${formattedName}</a></h3>`;
    content += `<p class="result-detail"><span class="icon">&#11088;</span><b>${data.rating}</b><span class="result-label">Overall Quality</span></p>`;

    if (data.numRatings) {
      content += `<p class="result-detail"><span class="icon">&#128100;</span><span class="result-label">Based on</span><b>${data.numRatings}</b><span class="result-label">ratings</span></p>`;
    }
    if (data.wouldTakeAgain) {
      content += `<p class="result-detail"><span class="icon">&#128077;</span><b>${data.wouldTakeAgain}</b><span class="result-label">would take again</span></p>`;
    }
    if (data.difficulty) {
      content += `<p class="result-detail"><span class="icon">&#x2699;&#xFE0F;</span><b>${data.difficulty}</b><span class="result-label">level of difficulty</span></p>`;
    }
  }

  content += "</div>";
  resultsContainer.innerHTML = content;
}

// Convert string to title case
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

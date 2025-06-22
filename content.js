function initializeProfessorRatings() {
  // Check for modern grid layout first
  const gridRows = document.querySelectorAll("div[data-uid]");
  if (gridRows.length > 0) {
    gridRows.forEach((row) => {
      const cell = row.querySelector('div[role="gridcell"]:nth-of-type(7)'); // Instructor column
      if (cell && !cell.querySelector(".rmp-container")) {
        processProfessorCell(cell, cell.innerText);
      }
    });
    return;
  }

  // Fallback to table layout
  const tableCells = document.querySelectorAll(
    'td[data-property="instructor"]'
  );
  if (tableCells.length > 0) {
    tableCells.forEach((cell) => {
      const link = cell.querySelector("a.email");
      if (link && !cell.querySelector(".rmp-container")) {
        processProfessorCell(cell, link.innerText);
      }
    });
  }
}

function processProfessorCell(cell, nameText) {
  const cleanedName = nameText.trim().split("(P")[0].trim(); // Remove "(Primary)" suffix

  if (!cleanedName || cleanedName.toLowerCase() === "tba") {
    return;
  }

  const nameParts = cleanedName.split(",");
  if (nameParts.length >= 2) {
    // Convert "Last, First" to "First Last"
    const professorName = `${nameParts[1].trim()} ${nameParts[0].trim()}`;

    const loadingElement = displayLoadingIndicator(cell);

    chrome.runtime.sendMessage(
      { type: "getRating", professorName },
      (response) => {
        loadingElement.remove();

        if (chrome.runtime.lastError) {
          console.error(
            "RMP Extension Error:",
            chrome.runtime.lastError.message
          );
          return;
        }
        if (response) {
          // Get user settings before displaying
          chrome.storage.sync.get(
            {
              showTakeAgain: false,
              showDifficulty: false,
            },
            (settings) => {
              displayRating(cell, response, settings);
            }
          );
        }
      }
    );
  }
}

function displayLoadingIndicator(cell) {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "rmp-container rmp-loading-container";
  loadingDiv.textContent = "Loading...";
  cell.appendChild(loadingDiv);
  return loadingDiv;
}

function displayRating(cell, data, settings) {
  const container = document.createElement("div");
  container.className = "rmp-container rmp-rating-container";

  // Main rating badge
  const ratingElement = document.createElement("a");
  ratingElement.href = data.url || "#";
  ratingElement.target = "_blank";
  ratingElement.className = `rmp-rating ${getRatingColorClass(data.rating)}`;
  ratingElement.textContent = data.rating;
  ratingElement.style.textDecoration = "none";
  ratingElement.style.color = "white";
  container.appendChild(ratingElement);

  // Optional "Would take again" percentage
  if (settings.showTakeAgain && data.wouldTakeAgain) {
    const takeAgainElement = document.createElement("div");
    takeAgainElement.className = "rmp-extra-detail";
    takeAgainElement.innerHTML = `&#x2713; <b>${data.wouldTakeAgain}</b> would take again`;
    container.appendChild(takeAgainElement);
  }

  // Optional difficulty level
  if (settings.showDifficulty && data.difficulty) {
    const difficultyElement = document.createElement("div");
    difficultyElement.className = "rmp-extra-detail";
    difficultyElement.innerHTML = `&#x2699; <b>${data.difficulty}</b> level of difficulty`;
    container.appendChild(difficultyElement);
  }

  cell.appendChild(container);
}

function getRatingColorClass(rating) {
  const score = parseFloat(rating);
  if (isNaN(score)) return "rmp-gray"; // Non-numeric ratings
  if (score >= 4.0) return "rmp-green";
  if (score >= 3.0) return "rmp-yellow";
  return "rmp-red";
}

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedInit = debounce(initializeProfessorRatings, 500);

// Watch for dynamic content changes
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
      debouncedInit();
      return;
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

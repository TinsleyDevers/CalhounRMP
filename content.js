// User settings for tooltip display
let settings = {
  showTakeAgain: true,
  showDifficulty: true,
  showNumRatings: true,
};

// Load initial settings from storage
chrome.storage.sync.get(settings, (data) => {
  settings = data;
});

// Update settings when they change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    for (let key in changes) {
      if (settings.hasOwnProperty(key)) {
        settings[key] = changes[key].newValue;
      }
    }
  }
});

// Main initialization function
function initializeProfessorRatings() {
  createTooltip();

  // Try modern grid layout first
  const gridRows = document.querySelectorAll("div[data-uid]");
  if (gridRows.length > 0) {
    gridRows.forEach((row) => {
      const cell = row.querySelector('div[role="gridcell"]:nth-of-type(7)');
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
  tableCells.forEach((cell) => {
    const link = cell.querySelector("a.email");
    if (link && !cell.querySelector(".rmp-container")) {
      processProfessorCell(cell, link.innerText);
    }
  });
}

// Process individual professor cell
function processProfessorCell(cell, nameText) {
  const cleanedName = nameText
    .trim()
    .replace(/\s*\(.*\)/, "")
    .trim();

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
          displayRating(cell, response);
        }
      }
    );
  }
}

// Show loading indicator while fetching data
function displayLoadingIndicator(cell) {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "rmp-container rmp-loading-container";
  loadingDiv.textContent = "Loading...";
  cell.appendChild(loadingDiv);
  return loadingDiv;
}

// Display rating badge in the cell
function displayRating(cell, data) {
  const container = document.createElement("div");
  container.className = "rmp-container";
  container.dataset.rmpData = JSON.stringify(data);

  const ratingElement = document.createElement("a");
  ratingElement.href = data.url || "#";
  ratingElement.target = "_blank";
  ratingElement.className = `rmp-rating ${getRatingColorClass(data.rating)}`;

  const score = parseFloat(data.rating);
  ratingElement.textContent = isNaN(score) ? "N/A" : score.toFixed(1);
  ratingElement.style.textDecoration = "none";

  container.appendChild(ratingElement);
  cell.appendChild(container);
}

// Get CSS color class based on rating score
function getRatingColorClass(rating) {
  const score = parseFloat(rating);
  if (isNaN(score)) return "rmp-gray";
  if (score >= 4.0) return "rmp-green";
  if (score >= 3.0) return "rmp-yellow";
  return "rmp-red";
}

let tooltipTimeout;

// Create tooltip element and event handlers
function createTooltip() {
  if (document.querySelector(".rmp-tooltip")) return;

  const tooltip = document.createElement("div");
  tooltip.className = "rmp-tooltip";
  document.body.appendChild(tooltip);

  // Show tooltip on mouseover
  document.body.addEventListener("mouseover", (e) => {
    const container = e.target.closest(".rmp-container");
    if (!container) return;

    clearTimeout(tooltipTimeout);
    updateTooltipContent(tooltip, JSON.parse(container.dataset.rmpData));

    const rect = container.getBoundingClientRect();
    const tooltipHeight = tooltip.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Position tooltip above or below based on available space
    if (spaceBelow < tooltipHeight + 15 && rect.top > tooltipHeight) {
      tooltip.classList.add("rmp-tooltip--flipped");
      tooltip.style.top = `${rect.top + window.scrollY - tooltipHeight - 8}px`;
    } else {
      tooltip.classList.remove("rmp-tooltip--flipped");
      tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
    }

    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.classList.add("rmp-tooltip--visible");
  });

  // Hide tooltip on mouseout
  document.body.addEventListener("mouseout", (e) => {
    const container = e.target.closest(".rmp-container");
    if (!container) return;

    tooltipTimeout = setTimeout(() => {
      tooltip.classList.remove("rmp-tooltip--visible");
    }, 200);
  });

  // Keep tooltip visible when hovering over it
  tooltip.addEventListener("mouseover", () => clearTimeout(tooltipTimeout));
  tooltip.addEventListener("mouseout", () => {
    tooltipTimeout = setTimeout(() => {
      tooltip.classList.remove("rmp-tooltip--visible");
    }, 200);
  });
}

// Update tooltip content based on settings and data
function updateTooltipContent(tooltip, data) {
  let content = "";

  if (data.rating === "Not Found" || data.rating === "Error") {
    content = `<div class="rmp-tooltip-detail">${
      data.rating === "Not Found"
        ? "Professor not found. Click badge to search."
        : "An error occurred. Click badge to search."
    }</div>`;
  } else {
    if (settings.showNumRatings && data.numRatings) {
      content += `<div class="rmp-tooltip-detail"><span class="rmp-tooltip-icon">&#128100;</span> <div>Based on <b>${data.numRatings}</b> ratings</div></div>`;
    }
    if (settings.showTakeAgain && data.wouldTakeAgain) {
      content += `<div class="rmp-tooltip-detail"><span class="rmp-tooltip-icon">&#128077;</span> <div><b>${data.wouldTakeAgain}</b> would take again</div></div>`;
    }
    if (settings.showDifficulty && data.difficulty) {
      content += `<div class="rmp-tooltip-detail"><span class="rmp-tooltip-icon">&#x2699;&#xFE0F;</span> <div><b>${data.difficulty}</b> level of difficulty</div></div>`;
    }
  }

  tooltip.innerHTML = content;
}

// Debounce function to limit frequent calls
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

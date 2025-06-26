// Save user preferences to storage
function saveOptions() {
  const showTakeAgain = document.getElementById("showTakeAgain").checked;
  const showDifficulty = document.getElementById("showDifficulty").checked;
  const showNumRatings = document.getElementById("showNumRatings").checked;

  chrome.storage.sync.set(
    {
      showTakeAgain,
      showDifficulty,
      showNumRatings,
    },
    () => {
      showStatus("Options saved.");
    }
  );
}

// Clear cached professor data
function clearCache() {
  chrome.storage.local.clear(() => {
    showStatus("Cache cleared.");
  });
}

// Load saved options from storage
function restoreOptions() {
  chrome.storage.sync.get(
    {
      showTakeAgain: true,
      showDifficulty: true,
      showNumRatings: true,
    },
    (items) => {
      document.getElementById("showTakeAgain").checked = items.showTakeAgain;
      document.getElementById("showDifficulty").checked = items.showDifficulty;
      document.getElementById("showNumRatings").checked = items.showNumRatings;
    }
  );
}

// Show temporary status message
function showStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 1500);
}

// Add event listeners
const saveButton = document.getElementById("save");
const clearCacheButton = document.getElementById("clearCache");

if (saveButton) {
  saveButton.addEventListener("click", saveOptions);
}

if (clearCacheButton) {
  clearCacheButton.addEventListener("click", clearCache);
}

// Initialize options when script loads
restoreOptions();

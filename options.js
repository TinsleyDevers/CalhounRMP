function saveOptions() {
  const showTakeAgain = document.getElementById("showTakeAgain").checked;
  const showDifficulty = document.getElementById("showDifficulty").checked;

  chrome.storage.sync.set(
    {
      showTakeAgain: showTakeAgain,
      showDifficulty: showDifficulty,
    },
    () => {
      // Show save confirmation
      const status = document.getElementById("status");
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    }
  );
}

function clearCache() {
  chrome.storage.local.clear(() => {
    // Show clear confirmation
    const status = document.getElementById("status");
    status.textContent = "Cache cleared.";
    setTimeout(() => {
      status.textContent = "";
    }, 1500);
  });
}

function restoreOptions() {
  // Default values
  chrome.storage.sync.get(
    {
      showTakeAgain: false,
      showDifficulty: false,
    },
    (items) => {
      document.getElementById("showTakeAgain").checked = items.showTakeAgain;
      document.getElementById("showDifficulty").checked = items.showDifficulty;
    }
  );
}

// Event listeners
const saveButton = document.getElementById("save");
const clearCacheButton = document.getElementById("clearCache");

if (saveButton) {
  saveButton.addEventListener("click", saveOptions);
}

if (clearCacheButton) {
  clearCacheButton.addEventListener("click", clearCache);
}

restoreOptions();

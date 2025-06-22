// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  // Load options.html into the options tab
  fetch("options.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("options").innerHTML = html;
      // Load options script after content is ready
      const optionsScript = document.createElement("script");
      optionsScript.src = "options.js";
      document.body.appendChild(optionsScript);
    });

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

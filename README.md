# Rate My Professor - Calhoun CC

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/alnpagcppnpochmheecogiogkibcnkgi?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/alnpagcppnpochmheecogiogkibcnkgi)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/alnpagcppnpochmheecogiogkibcnkgi?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/alnpagcppnpochmheecogiogkibcnkgi)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/alnpagcppnpochmheecogiogkibcnkgi?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/alnpagcppnpochmheecogiogkibcnkgi)

This Chrome extension seamlessly integrates [Rate My Professors](https://www.ratemyprofessors.com/) (RMP) ratings directly into the Calhoun Community College course registration portal. It helps students make more informed decisions when selecting their classes by providing immediate access to professor ratings and reviews.

## Key Features

- **Automatic Ratings:** See a professor's overall rating (out of 5.0) right next to their name in the course listings.
- **Detailed Insights:** Enable options to see a professor's "Would take again" percentage and their "Level of Difficulty."
- **Direct Links:** Each rating includes a link that takes you directly to that professor's page on RMP for more detailed reviews.
- **Smart Caching:** Ratings are cached for 24 hours to improve performance and reduce requests to RMP.

## Installation

1.  Install the extension from the [**Chrome Web Store**](https://chromewebstore.google.com/detail/alnpagcppnpochmheecogiogkibcnkgi).
2.  Click "Add to Chrome".
3.  The extension will be installed and will automatically activate when you visit the Calhoun course registration page. No further setup is needed!

## How It Works

The extension's content script identifies the professor's name listed for each course on the registration page. It then communicates with the background script, which fetches the corresponding rating data from Rate My Professors by scraping the site. To minimize load times and API calls, professor ratings are cached locally for 24 hours.

## Configuration

You can customize your experience via the extension's popup menu:

1.  Click the extension icon in the Chrome toolbar.
2.  Navigate to the **Options** tab.
3.  Here you can:
    - Toggle the display of the "Would take again" percentage.
    - Toggle the display of the "Level of Difficulty" score.
    - Clear the local cache of professor ratings.

## For Developers

This project is built with standard HTML, CSS, and JavaScript, following the Chrome Extension (Manifest V3) architecture.

- `manifest.json`: Defines the extension's permissions, scripts, and metadata.
- `background.js`: The service worker responsible for fetching data from Rate My Professors, handling caching logic, and responding to messages from content scripts.
- `content.js`: Injected into the Calhoun registration pages. It's responsible for finding professor names, sending requests to the background script, and injecting the rating UI into the page.
- `popup.html` / `popup.js`: Manages the popup UI, including the tab switching between the "About" and "Options" pages.
- `options.html` / `options.js`: Provides the UI and logic for the user-configurable settings. User preferences are saved using `chrome.storage.sync`.
- `style.css`: Contains all the styles for the injected UI elements and the popup.

## Privacy

This extension is built with user privacy in mind.

- **Single Purpose:** Its sole function is to display professor ratings from Rate My Professors directly on the Calhoun Community College course registration page.
- **Data Usage:** The extension does **not** collect, store, or transmit any personally identifiable information (PII).
  - The `storage` permission is used only to save your display preferences and to temporarily cache rating data locally on your device to improve performance.
  - Host permissions for `ratemyprofessors.com`, `experience.elluciancloud.com`, and `reg-prod.ec.accs.edu` are required to fetch rating data and inject it into the correct pages.
- The extension does not use or require remote code, and it does not sell or transfer user data to any third parties.

## License

This project is licensed under the MIT License.

Copyright (c) 2025 Tinsley Devers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

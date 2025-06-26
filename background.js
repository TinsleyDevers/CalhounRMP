const SCHOOL_ID = "1786";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getRating") {
    getCachedOrFetchRating(request.professorName)
      .then(sendResponse)
      .catch((error) => {
        console.error(
          `Failed to get rating for "${request.professorName}":`,
          error
        );
        const searchUrl = `https://www.ratemyprofessors.com/search/professors/${SCHOOL_ID}?q=${encodeURIComponent(
          request.professorName
        )}`;
        sendResponse({ rating: "Error", url: searchUrl });
      });
    return true; // Keep message channel open for async response
  }
});

// Check cache first, then fetch if needed
async function getCachedOrFetchRating(professorName) {
  const cacheKey = `rmp-cache-${professorName.toLowerCase()}`;
  const cachedData = await chrome.storage.local.get(cacheKey);

  // Return cached data if still fresh
  if (
    cachedData[cacheKey] &&
    Date.now() - cachedData[cacheKey].timestamp < CACHE_DURATION_MS
  ) {
    return cachedData[cacheKey].data;
  }

  // Fetch new data and cache it
  const newData = await fetchProfessorRating(professorName);
  await chrome.storage.local.set({
    [cacheKey]: { data: newData, timestamp: Date.now() },
  });

  return newData;
}

// Fetch professor rating from RateMyProfessors
async function fetchProfessorRating(professorName) {
  const searchUrl = `https://www.ratemyprofessors.com/search/professors/${SCHOOL_ID}?q=${encodeURIComponent(
    professorName
  )}`;

  try {
    // Get search results page
    const searchResponse = await fetch(searchUrl);
    const searchResponseText = await searchResponse.text();
    const jsonMatch = searchResponseText.match(/__RELAY_STORE__ = (\{.*?\});/);

    if (!jsonMatch?.[1]) {
      return { rating: "Not Found", url: searchUrl };
    }

    // Find matching professor using fuzzy name matching
    const relayStore = JSON.parse(jsonMatch[1]);
    const professorLegacyId = findBestProfessorMatch(relayStore, professorName);

    if (!professorLegacyId) {
      return { rating: "Not Found", url: searchUrl };
    }

    // Scrape professor's page for rating data
    const professorUrl = `https://www.ratemyprofessors.com/professor/${professorLegacyId}`;
    const pageResponse = await fetch(professorUrl);
    const pageText = await pageResponse.text();

    return extractRatingData(pageText, professorUrl);
  } catch (error) {
    console.error("Error fetching professor rating:", error);
    return { rating: "Error", url: searchUrl };
  }
}

// Find best matching professor using Levenshtein distance
function findBestProfessorMatch(relayStore, professorName) {
  const nameParts = professorName.trim().split(/\s+/);
  const searchFirstName = nameParts.slice(0, -1).join(" ").toLowerCase();
  const searchLastName = nameParts.slice(-1)[0].toLowerCase();

  let bestMatch = null;
  let minDistance = Infinity;

  for (const item of Object.values(relayStore)) {
    if (
      item?.__typename === "Teacher" &&
      item.lastName?.toLowerCase() === searchLastName
    ) {
      const distance = levenshtein(
        searchFirstName,
        item.firstName.toLowerCase()
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = item;
      }
    }
  }

  // Allow small differences in first name (threshold of 2)
  return bestMatch && minDistance <= 2 ? bestMatch.legacyId : null;
}

// Extract rating information from professor's page HTML
function extractRatingData(pageText, professorUrl) {
  const ratingMatch = pageText.match(
    /<div class="RatingValue__Numerator.*?">([\d.]+)<\/div>/
  );
  const takeAgainMatch = pageText.match(
    /<div class="FeedbackItem__FeedbackNumber.*?">(\d{1,3}%)<\/div>.*?Would take again/
  );
  const difficultyMatch = pageText.match(
    /<div class="FeedbackItem__FeedbackNumber.*?">([\d.]+)<\/div>.*?Level of Difficulty/
  );
  const numRatingsMatch = pageText.match(/based on.*?<a[^>]*>(\d+)/i);

  return {
    rating: ratingMatch?.[1] ? `${ratingMatch[1]} / 5.0` : "No Ratings",
    wouldTakeAgain: takeAgainMatch?.[1] || null,
    difficulty: difficultyMatch?.[1] || null,
    numRatings: numRatingsMatch?.[1] || null,
    url: professorUrl,
  };
}

// Calculate Levenshtein distance between two strings
function levenshtein(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(newValue, lastValue, costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

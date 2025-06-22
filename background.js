const SCHOOL_ID = "1786";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getRating") {
    getCachedOrFetchRating(request.professorName)
      .then((ratingInfo) => sendResponse(ratingInfo))
      .catch((error) => {
        console.error(
          `RMP Extension Error: Failed to get rating for "${request.professorName}".`,
          error
        );
        // Fallback search URL on error
        const searchUrl = `https://www.ratemyprofessors.com/search/professors/${SCHOOL_ID}?q=${encodeURIComponent(
          request.professorName
        )}`;
        sendResponse({ rating: "Error", url: searchUrl });
      });
    return true; // Async response
  }
});
async function getCachedOrFetchRating(professorName) {
  const cacheKey = `rmp-cache-${professorName.toLowerCase()}`;

  const cachedData = await chrome.storage.local.get(cacheKey);

  // Return cached data if fresh
  if (
    cachedData[cacheKey] &&
    Date.now() - cachedData[cacheKey].timestamp < CACHE_DURATION_MS
  ) {
    return cachedData[cacheKey].data;
  }

  // Fetch and cache new data
  const newData = await fetchProfessorRating(professorName);
  await chrome.storage.local.set({
    [cacheKey]: {
      data: newData,
      timestamp: Date.now(),
    },
  });

  return newData;
}

async function fetchProfessorRating(professorName) {
  const searchUrl = `https://www.ratemyprofessors.com/search/professors/${SCHOOL_ID}?q=${encodeURIComponent(
    professorName
  )}`;

  // Step 1: Find professor's page URL
  const searchResponse = await fetch(searchUrl);
  const searchResponseText = await searchResponse.text();
  const jsonMatch = searchResponseText.match(/__RELAY_STORE__ = (\{.*?\});/);

  if (!jsonMatch || !jsonMatch[1]) {
    return { rating: "Not Found", url: searchUrl };
  }

  const relayStore = JSON.parse(jsonMatch[1]);
  const searchLastName = professorName.split(" ").pop().toLowerCase();
  let professorLegacyId = null;

  // Find matching professor by last name
  for (const item of Object.values(relayStore)) {
    if (
      item &&
      item.__typename === "Teacher" &&
      item.lastName?.toLowerCase() === searchLastName
    ) {
      professorLegacyId = item.legacyId;
      break;
    }
  }

  if (!professorLegacyId) {
    return { rating: "Not Found", url: searchUrl };
  }

  const professorUrl = `https://www.ratemyprofessors.com/professor/${professorLegacyId}`;

  // Step 2: Scrape rating data from professor's page
  const pageResponse = await fetch(professorUrl);
  const pageResponseText = await pageResponse.text();

  // Extract rating data using regex
  const ratingMatch = pageResponseText.match(
    /<div class="RatingValue__Numerator.*?">([\d.]+)<\/div>/
  );
  const takeAgainMatch = pageResponseText.match(
    /<div class="FeedbackItem__FeedbackNumber.*?">(\d{1,3}%)<\/div>.*?Would take again/
  );
  const difficultyMatch = pageResponseText.match(
    /<div class="FeedbackItem__FeedbackNumber.*?">([\d.]+)<\/div>.*?Level of Difficulty/
  );
  const ratingData = {
    rating:
      ratingMatch && ratingMatch[1] ? `${ratingMatch[1]} / 5.0` : "No Ratings",
    wouldTakeAgain:
      takeAgainMatch && takeAgainMatch[1] ? takeAgainMatch[1] : null,
    difficulty:
      difficultyMatch && difficultyMatch[1] ? difficultyMatch[1] : null,
    url: professorUrl,
  };

  return ratingData;
}

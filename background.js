// background.js
// Imports
import debugConsole from "./debug.js";
const DEBUG = false;

// Event listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (DEBUG) debugConsole.log("Received message", request);
  try {
    switch (request.type) {
      case "getAutocompletion":
        // Process synchronously if possible
        getAutocompleteSuggestion(request.value, request.context)
          .then((suggestion) => {
            sendResponse({ suggestion: suggestion });
          })
          .catch((error) => {
            sendResponse({ error: error.message });
          });
        return true;
      default:
        if (DEBUG) debugConsole.error("Unknown message type", request.type);
        break;
    }
  } catch (error) {
    console.error("Error in background.js", error);
  }
});

async function getAutocompleteSuggestion(value, context) {
  //   return "Static suggestion"; // For testing
  //   const settings = await chrome.storage.sync.get();
  const settings = {
    apiKey: "api key here",
  };
  debugConsole.log("Settings", settings);

  if (!settings.apiKey) {
    throw new Error("API key not found");
  }
  const API_KEY = settings.apiKey;

  if (DEBUG) debugConsole.log("Getting autocomplete suggestion for:", value);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // model: "mistralai/mistral-small-24b-instruct-2501:free",
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "system",
            content: `
            The user has entered the following text: ${value}
            The context of the text is: ${context}
            Provide only an accurate autocomplete suggestion, matching the context, intended tone, and the jist of the text.
            Nothing more or less. If a starting space is needed, add one. Complete in same language as text.
            If it the text is nonsensical, return nothing.
            `,
          },
        ],
      }),
    });

    const data = await response.json();
    debugConsole.log("data", data);
    if (data.error) return null;
    if (data.choices.length === 0) return null;
    if (data.choices[0].message.content === "null") return null; // Nonsensical user input, return nothing
    const suggestion = data.choices[0].message.content;
    return suggestion;
  } catch (error) {
    debugConsole.error("Error getting autocomplete suggestion:", error);
    return null;
  }
}

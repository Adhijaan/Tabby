"use strict";

// Globals
const API_KEY = "open router ai api key";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
      console.error("Unknown message type", request.type);
      break;
  }
});

async function getAutocompleteSuggestion(value, context) {
  return " Static suggestion"; // For testing
  console.log("Getting autocomplete suggestion for:", value);
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small-24b-instruct-2501:free",
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
    console.log("data", data);
    if (data.error) return null;
    if (data.choices.length === 0) return null;
    if (data.choices[0].message.content === "null") return null; // Nonsensical user input, return nothing
    const suggestion = data.choices[0].message.content;
    return suggestion;
  } catch (error) {
    console.error("Error getting autocomplete suggestion:", error);
    return null;
  }
}

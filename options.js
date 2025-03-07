import contentConsole from "./debug.js";
// Wait for DOM to be fully loaded before accessing elements
document.addEventListener("DOMContentLoaded", function () {
  contentConsole.log("Tabby options fully loaded");

  // Get form elements
  const apiKeyInput = document.getElementById("api-key");
  const apiStatus = document.getElementById("api-status");
  const saveButton = document.getElementById("save-button");
  const enabledState = document.getElementById("active");
  const visibilityToggle = document.getElementById("toggle-visibility");

  // Initialize the settings in the popup
  async function loadSettings() {
    contentConsole.log("Loading settings");
    try {
      const settings = await chrome.storage.local.get();
      contentConsole.log("Settings loaded:", settings);

      // Set API key if it exists
      if (settings.apiKey) {
        apiKeyInput.value = settings.apiKey;
      } else {
        apiKeyInput.value = "";
        apiStatus.textContent = "Please enter an API key";
        apiStatus.className = "status neutral";
      }

      // Set enabled state
      enabledState.checked = settings.active !== false;

      // Mask API key initially
      apiKeyInput.type = "password";
      visibilityToggle.textContent = "👁️";
    } catch (error) {
      contentConsole.error("Error loading settings:", error);
      apiStatus.textContent = "Error loading settings";
      apiStatus.className = "status error";
    }
  }

  // Save settings
  async function saveSettings() {
    contentConsole.log("Saving settings");
    const apiKey = apiKeyInput.value;
    const active = enabledState.checked;

    // Change to saving state
    saveButton.textContent = "Saving...";
    saveButton.disabled = true;

    // Check if API key is empty
    if (!apiKey) {
      apiStatus.textContent = "Please enter an API key";
      apiStatus.className = "status error";
      saveButton.textContent = "Save Settings";
      saveButton.disabled = false;
      return;
    }

    // Validate API key if changed
    if (apiKey !== chrome.storage.local.get("apiKey")) {
      const isValid = await validateApiKey(apiKey);

      if (!isValid) {
        saveButton.textContent = "Save Settings";
        saveButton.disabled = false;
        return; // Don't save if invalid
      }
    }

    // Save settings to local storage
    try {
      await chrome.storage.local.set({ apiKey, active });
      saveButton.textContent = "Save Settings";
      apiStatus.textContent = "Settings saved";
      apiStatus.className = "status success";
      saveButton.disabled = false;
      setTimeout(() => {
        apiStatus.textContent = "";
        apiStatus.className = "status";
      }, 2000);
    } catch (error) {
      contentConsole.error("Error saving settings:", error);
      apiStatus.textContent = "Failed to save settings";
      apiStatus.className = "status error";
      saveButton.textContent = "Save Settings";
      saveButton.disabled = false;
    }
  }

  // Validate API key
  async function validateApiKey(apiKey) {
    try {
      apiStatus.textContent = "Validating API key...";
      apiStatus.className = "status pending";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-exp:free",
          messages: [
            {
              role: "user",
              content: "Say yes",
            },
          ],
        }),
      });

      // Invalid API key check
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Invalid API key");
        }
        throw new Error("Failed to validate API key");
      }

      // Parse response
      const data = await response.json();
      contentConsole.log("data", data);

      // Check rate limit
      if (data.error) {
        contentConsole.log("cp 3");
        if (data.error.code === 402 || data.error.code === 429) {
          throw new Error("Rate limit exceeded on API key");
        }
        throw new Error("Error validating API key");
      }
      apiStatus.textContent = "API key valid";
      apiStatus.className = "status success";
      return true;
    } catch (error) {
      // Network or other error
      apiStatus.textContent = `Error: ${error.message}`;
      apiStatus.className = "status error";
      return false;
    }
  }

  // Toggle visibility of API key
  function toggleVisibility() {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      visibilityToggle.textContent = "🙈";
    } else {
      apiKeyInput.type = "password";
      visibilityToggle.textContent = "👁️";
    }
  }

  // Load settings immediately
  loadSettings();

  // Add Event listeners
  saveButton.addEventListener("click", saveSettings);
  visibilityToggle.addEventListener("click", toggleVisibility);
});

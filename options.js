// options.js
// Form input and options
const apiKeyInput = document.getElementById("api-key");
const apiStatus = document.getElementById("api-status");
const validateButton = document.getElementById("validate-button");
const saveButton = document.getElementById("save-button");
const enabledState = document.getElementById("active");

// Initialize the settings in the popup
async function loadSettings() {
  const settings = await chrome.storage.sync.get();

  // Set API key if it exists (value is hidden by password input)
  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
  } else {
    apiKeyInput.value = "";
    apiStatus.textContent = "Please enter an API key";
    apiStatus.className = "status normal";
  }

  // Set enabled state
  const enabledState = settings.isEnabled !== false; // Default to true if not set
  document.getElementById("isEnabled").checked = enabledState;

  document.getElementById("toggle-visibility").addEventListener(toggleVisibility);

  return settings;
}

// Save settings
async function saveSettings() {
  const apiKey = apiKeyInput.value;
  const active = enabledState.checked;

  // Change to saving state
  saveButton.textContent = "Saving...";

  // Check if API key is empty
  if (!apiKey) {
    apiStatus.textContent = "Please enter an API key";
    apiStatus.className = "status error";
    return;
  }
  if (!(await validateApiKey())) return;

  // Save settings
  try {
    await chrome.storage.sync.set({ apiKey, active });
    saveButton.textContent = "Save Settings";
    apiStatus.textContent = "Settings saved";
    apiStatus.className = "status success";
    setTimeout(() => {
      apiStatus.textContent = "";
      apiStatus.className = "status";
    }, 2000);
  } catch (error) {
    console.error("Error saving settings:", error);
    apiStatus.textContent = "Failed to save settings";
    apiStatus.className = "status error";
  }
}

// Validate API key
async function validateApiKey() {
  saveButton.disabled = true;
  const apiKey = apiKeyInput.value;
  // Make API request to validate key
  fetch("https://openrouter.ai/api/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      // Re-enable save button
      saveButton.disabled = false;
      if (response.ok) {
        return true;
      } else {
        // Invalid key or other error
        apiStatus.textContent = `Error: ${response.status} - Invalid API key`;
        apiStatus.className = "status error";
        return false;
      }
    })
    .catch((error) => {
      // Network or other error
      apiStatus.textContent = `Error: ${error.message}`;
      apiStatus.className = "status error";
      return false;
    });
}
// Load settings when opened
document.addEventListener("DOMContentLoaded", loadSettings);

// Toggle visibility of API key
function toggleVisibility() {
  if (apiKeyInput.type === "text") {
    apiKeyInput.type = "password";
    this.textContent = "👁️";
  } else {
    apiKeyInput.type = "text";
    this.textContent = "👁️‍🗨️";
  }
}

// Save settings when save button is clicked
saveButton.addEventListener("click", saveSettings);

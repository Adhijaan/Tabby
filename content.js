// content.js
// Global variables
let timeout = null;
let activeTextarea = null;
let activeGhostText = null;
let activeSuggestion = null;

document.addEventListener("focusin", async (event) => {
  chrome.storage.local.get(["active"], (result) => {
    if (!result.active) return;
  });

  console.log("isvalid box", isValidTextBox(event.target));
  if (!isValidTextBox(event.target)) return;

  const textarea = event.target;
  activeTextarea = textarea;

  const context = null; // TODO: get the context around textarea

  const handleInput = () => handleSuggestion(textarea, context);
  const handleKeydown = (event) => handleTabPress(event, textarea);

  textarea.addEventListener("input", handleInput);
  textarea.addEventListener("keydown", handleKeydown);
  textarea.addEventListener("blur", removeGhostText);
  textarea.addEventListener("scroll", syncScroll);
  resizeObserver.observe(textarea);

  // Clean up previous listeners when textarea changes
  textarea.addEventListener(
    "focusout",
    () => {
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("keydown", handleKeydown);
      textarea.removeEventListener("blur", removeGhostText);
      textarea.removeEventListener("scroll", syncScroll);
      resizeObserver.unobserve(textarea);
    },
    { once: true }
  );
});

async function handleSuggestion(textarea, context) {
  removeGhostText(); // Remove existing suggestion
  if (textarea.value.length === 0) return;
  clearTimeout(timeout);
  timeout = setTimeout(() => Suggest(context), 200);
}

function handleTabPress(event, textarea) {
  if (event.key === "Tab" && activeSuggestion) {
    event.preventDefault();
    textarea.value = textarea.value + activeSuggestion;
    activeSuggestion = null;
    removeGhostText();
  }
}

function removeGhostText() {
  if (activeGhostText) {
    console.log("Removing ghost text");
    activeGhostText.remove();
    activeGhostText = null;
  } else {
    console.log("No ghost text to remove");
  }
}

function Suggest(context) {
  try {
    chrome.runtime.sendMessage({ type: "getAutocompletion", value: activeTextarea.value, context }, (response) => {
      if (response.error) {
        console.error("Error getting autocomplete suggestion:", response.error);
        return;
      }
      if (!response.suggestion) return;
      activeSuggestion = response.suggestion;
      createGhostText(response.suggestion);
    });
  } catch (error) {
    console.error("Error sending message to background.js", error);
  }
}

function createGhostText(suggestion) {
  if (activeGhostText) removeGhostText();
  if (!activeTextarea) return;

  // Todo: how to suggest between words.
  const cursorPosition = activeTextarea.selectionStart;
  const isAtEnd = cursorPosition === activeTextarea.value.length;
  console.log("Cursor position", cursorPosition, "isAtEnd", isAtEnd);
  if (!isAtEnd) return;

  activeGhostText = document.createElement("div");
  activeGhostText.textContent = activeTextarea.value + suggestion;
  const computedStyle = window.getComputedStyle(activeTextarea);
  const styles = {
    // Text appearance
    color: computedStyle.color,
    opacity: computedStyle.opacity * 0.5,
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    fontWeight: computedStyle.fontWeight,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    textAlign: computedStyle.textAlign,
    textDecoration: computedStyle.textDecoration,
    textShadow: computedStyle.textShadow,
    textTransform: computedStyle.textTransform,
    textWrapMode: computedStyle.textWrapMode,
    // whiteSpace: "pre-wrap",
    whiteSpace: computedStyle.whiteSpace,
    overflowWrap: computedStyle.overflowWrap,
    wordBreak: computedStyle.wordBreak,

    // Positioning and dimensions
    position: "absolute",
    padding: computedStyle.padding,
    border: computedStyle.border,
    boxSizing: computedStyle.boxSizing,

    // Behavior
    pointerEvents: "none",
    overflow: computedStyle.overflow,

    // Border
    border: computedStyle.border,
    // borderColor: "transparent",
    borderColor: "solid",
  };

  // Assign styles
  Object.assign(activeGhostText.style, styles);
  // Update position
  updateGhostTextPosition();

  // Append to the DOM
  activeTextarea.parentElement.appendChild(activeGhostText);

  // Align the scrolled text
  syncScroll();
}

const resizeObserver = new ResizeObserver((entries) => {
  updateGhostTextPosition();
});

function updateGhostTextPosition() {
  if (!activeGhostText || !activeTextarea) return;
  const rect = activeTextarea.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(activeTextarea);
  activeGhostText.style.top = `${rect.top}px`;
  activeGhostText.style.left = `${rect.left}px`;
  activeGhostText.style.height = `${
    rect.height -
    parseFloat(computedStyle.paddingTop) -
    parseFloat(computedStyle.paddingBottom) -
    parseFloat(computedStyle.borderTopWidth) -
    parseFloat(computedStyle.borderBottomWidth)
  }px`;
  activeGhostText.style.width = `${
    rect.width -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight) -
    parseFloat(computedStyle.borderLeftWidth) -
    parseFloat(computedStyle.borderRightWidth)
  }px`;
}

function syncScroll() {
  if (!activeGhostText || !activeTextarea) return;
  activeGhostText.scrollTop = activeTextarea.scrollTop;
  activeGhostText.scrollLeft = activeTextarea.scrollLeft;
}

// Utils
// Debug Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "Debug") {
    try {
      console[request.level](...request.message);
    } catch (error) {
      console.error("Invalid Debug message from Worker", error);
    }
  }
});

function isValidTextBox(element) {
  // Validate the input box
  // Textarea
  if (element instanceof HTMLTextAreaElement) {
    return true;
  }
  // Input
  if (element instanceof HTMLInputElement) {
    const validTypes = ["text", "search"];
    return validTypes.includes(element.type.toLowerCase());
  }
  return false;
}

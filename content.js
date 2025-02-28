// content.js
// Global variables
let timeout = null;
let activeTextarea = null;
let activeGhostText = null;
let activeSuggestion = null;

document.addEventListener("focusin", async (event) => {
  if (event.target.tagName.toLowerCase() !== "textarea") return;

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
  textarea.addEventListener("focusout", () => {
    textarea.removeEventListener("input", handleInput);
    textarea.removeEventListener("keydown", handleKeydown);
    textarea.removeEventListener("blur", removeGhostText);
    textarea.removeEventListener("scroll", syncScroll);
  });
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
      // Append to the DOM
      activeTextarea.parentElement.appendChild(activeGhostText);
    });
  } catch (error) {
    console.error("Error sending message to background.js", error);
  }
}

function createGhostText(suggestion) {
  activeGhostText = document.createElement("div");
  // console.log(`Element ${activeTextarea.value}`);
  activeGhostText.textContent = activeTextarea.value + suggestion;
  // console.log(`Ghost ${activeGhostText.textContent}`);

  const computedStyle = window.getComputedStyle(activeTextarea);

  const styles = {
    // Mimic the text
    color: computedStyle.color,
    opacity: computedStyle.opacity * 0.5,
    fontWeight: computedStyle.fontWeight,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    textDecoration: computedStyle.textDecoration,
    lineHeight: computedStyle.lineHeight,
    letterSpacing: computedStyle.letterSpacing,
    textAlign: computedStyle.textAlign,
    textTransform: computedStyle.textTransform,
    textShadow: computedStyle.textShadow,
    // Overlay
    overflow: computedStyle.overflow,
    position: "absolute",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    border: computedStyle.border,
    // borderColor: "transparent",
    borderColor: "blue", // TODO: remove
    padding: computedStyle.padding,
    boxSizing: computedStyle.boxSizing,
    outline: computedStyle.outline,
    scrollTop: computedStyle.scrollTop,
    scrollLeft: computedStyle.scrollLeft,
  };
  // Assign styles
  Object.assign(activeGhostText.style, styles);
  // Update position
  updateGhostTextPosition();
}

const resizeObserver = new ResizeObserver((entries) => {
  if (activeGhostText && activeTextarea) {
    updateGhostTextPosition();
  }
});

function updateGhostTextPosition() {
  if (!activeGhostText) return;
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
  // Align the scrolled text
  syncScroll();
}

function syncScroll() {
  if (!activeGhostText) return;
  // console.log(
  //   `Before ${activeGhostText.scrollTop} ${activeTextarea.scrollTop} ${
  //     activeGhostText.scrollTop - activeTextarea.scrollTop
  //   }`
  // );

  activeGhostText.scrollTop = activeTextarea.scrollTop;
  activeGhostText.scrollLeft = activeTextarea.scrollLeft;
  // console.log(
  //   `After ${activeGhostText.scrollTop} ${activeTextarea.scrollTop} ${
  //     activeGhostText.scrollTop - activeTextarea.scrollTop
  //   }`
  // );
}

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

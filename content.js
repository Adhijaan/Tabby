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
  resizeObserver.observe(textarea);
  const context = null; // TODO: get the context around textarea

  const handleInput = () => handleSuggestion(textarea, context);
  const handleKeydown = (event) => handleTabPress(event, textarea);

  textarea.addEventListener("input", handleInput);
  textarea.addEventListener("keydown", handleKeydown);
  textarea.addEventListener("blur", removeGhostText);

  // Clean up previous listeners when textarea changes
  textarea.addEventListener("focusout", () => {
    textarea.removeEventListener("input", handleInput);
    textarea.removeEventListener("keydown", handleKeydown);
    textarea.removeEventListener("blur", removeGhostText);
  });
});

async function handleSuggestion(textarea, context) {
  removeGhostText();
  if (textarea.value.length === 0) return;
  console.log("handleSuggestion", textarea.value);
  clearTimeout(timeout);
  timeout = setTimeout(() => Suggest(textarea, context), 200);
}

function handleTabPress(event, textarea) {
  if (event.key === "Tab" && activeSuggestion) {
    textarea.value = textarea.value + activeSuggestion;
    activeSuggestion = null;
    removeGhostText();
    event.preventDefault();
  }
}

function removeGhostText() {
  if (activeGhostText) {
    activeGhostText.remove();
    activeGhostText = null;
  }
}

async function Suggest(textarea, context) {
  const suggestion = await getAutocompleteSuggestion(textarea.value, context);
  const ghostText = createGhostText(suggestion, textarea);
  textarea.parentElement.appendChild(ghostText);
  activeGhostText = ghostText;
  activeSuggestion = suggestion;
  textarea.addEventListener("scroll", syncScroll);
  textarea.addEventListener("focusout", () => textarea.removeEventListener("scroll", syncScroll));
}

async function getAutocompleteSuggestion(value, context) {
  // TODO: connect to an LLM to get the suggestion
  const suggestion = " Static Suggestion";
  return suggestion;
}

function createGhostText(suggestion, textElement) {
  const currText = textElement.value;
  const ghostText = document.createElement("div");
  ghostText.textContent = currText + suggestion;

  const computedStyle = window.getComputedStyle(textElement);
  const rect = textElement.getBoundingClientRect();

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
    margin: computedStyle.margin,
    boxSizing: computedStyle.boxSizing,
    outline: computedStyle.outline,
    scrollTop: computedStyle.scrollTop,
    scrollLeft: computedStyle.scrollLeft,
  };
  // Assign styles
  Object.assign(ghostText.style, styles);
  // Update position
  updateGhostTextPosition(activeTextarea, ghostText);
  return ghostText;
}

const resizeObserver = new ResizeObserver((entries) => {
  if (activeGhostText && activeTextarea) {
    updateGhostTextPosition(activeTextarea, activeGhostText);
  }
});

function updateGhostTextPosition(textarea, ghostText) {
  const rect = textarea.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(textarea);
  ghostText.style.top = `${rect.top}px`;
  ghostText.style.left = `${rect.left}px`;
  ghostText.style.height = `${
    rect.height -
    parseFloat(computedStyle.paddingTop) -
    parseFloat(computedStyle.paddingBottom) -
    parseFloat(computedStyle.borderTopWidth) -
    parseFloat(computedStyle.borderBottomWidth)
  }px`;
  ghostText.style.width = `${
    rect.width -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight) -
    parseFloat(computedStyle.borderLeftWidth) -
    parseFloat(computedStyle.borderRightWidth)
  }px`;
}

function syncScroll() {
  if (!activeGhostText) return;
  activeGhostText.scrollTop = activeTextarea.scrollTop;
  activeGhostText.scrollLeft = activeTextarea.scrollLeft;
}

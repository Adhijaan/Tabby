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

  // Clean up previous listeners when textarea changes
  textarea.addEventListener("focusout", () => {
    textarea.removeEventListener("input", handleInput);
    textarea.removeEventListener("keydown", handleKeydown);
    textarea.removeEventListener("blur", removeGhostText);
  });
});

function removeGhostText() {
  if (activeGhostText) {
    activeGhostText.remove();
    activeGhostText = null;
  }
}

async function handleSuggestion(textarea, context) {
  clearTimeout(timeout);
  removeGhostText(); // Remove previous ghost text
  timeout = setTimeout(() => Suggest(textarea, context), 500);
}

async function Suggest(textarea, context) {
  const suggestion = await getAutocompleteSuggestion(textarea.value, context);
  const ghostText = createGhostText(suggestion, textarea);
  textarea.parentElement.appendChild(ghostText);
  activeGhostText = ghostText;
  activeSuggestion = suggestion;
}

function handleTabPress(event, textarea) {
  if (event.key === "Tab" && activeSuggestion) {
    textarea.value = textarea.value + activeSuggestion;
    activeSuggestion = null;
    activeGhostText.remove();
    event.preventDefault();
  }
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
  const styles = {
    // Mimic the text element
    color: computedStyle.color,
    opacity: computedStyle.opacity * 0.5,
    fontWeight: computedStyle.fontWeight,
    fontSize: computedStyle.fontSize,
    fontFamily: computedStyle.fontFamily,
    textDecoration: computedStyle.textDecoration,
    // Overlay
    position: "absolute",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    top: `${textElement.offsetTop}px`,
    left: `${textElement.offsetLeft}px`,
    height: `${textElement.offsetHeight}px`,
    width: `${textElement.offsetWidth}px`,
    border: computedStyle.border,
    padding: computedStyle.padding,
    margin: computedStyle.margin,
  };

  Object.assign(ghostText.style, styles);
  return ghostText;
}

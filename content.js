// content.js
document.addEventListener("focusin", async (event) => {
  // Make sure textarea is focused
  if (event.target.tagName.toLowerCase() !== "textarea") return;

  // Get the textarea value
  const textarea = event.target;
  const value = textarea.value;
  const context = []; // TODO: get the context of the textarea
  // Get the autocomplete suggestions
  const suggestion = await getAutocompleteSuggestion(value, context);
  const ghostText = createGhostText(value, suggestion, textarea);
  textarea.parentElement.appendChild(ghostText);
});

async function getAutocompleteSuggestion(value, context) {
  // TODO: connect to an LLM to get the suggestion
  const suggestion = "Static Suggestion";
  return suggestion;
}

function createGhostText(text, suggestion, textElement) {
  const ghostText = document.createElement("div");
  ghostText.textContent = text + " " + suggestion;

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

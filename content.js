// content.js
document.addEventListener("focusin", async (event) => {
  // Make sure textarea is focused
  if (!event.target.tagName.toLowerCase() === "textarea") return;

  // Get the textarea value
  const textarea = event.target;
  const value = textarea.value;
  const context = []; // TODO: get the context of the textarea
  // Get the autocomplete suggestions
  const suggestion = await getAutocompleteSuggestion(value, context);
  const ghostText = getGhostText(suggestion, getTextFormat(textarea));
  ghostText.style.position = "absolute";
  ghostText.style.top = textarea.offsetTop + "px";
  ghostText.style.left = textarea.offsetLeft + "px";
  ghostText.style.pointerEvents = "none";
  ghostText.style.whiteSpace = "pre-wrap";
  textarea.parentElement.appendChild(ghostText);
});

async function getAutocompleteSuggestion(value, context) {
  // TODO: connect to an LLM to get the suggestion
  const suggestion = "Static Suggestion";
  return suggestion;
}

function getGhostText(text, orginalTextFormat) {
  const ghostText = document.createElement("div");
  ghostText.textContent = text;
  ghostColor = "rgba(0, 0, 0, 0.5)"; // TODO: make it a blunter shade of the text color
  ghostText.style.color = ghostColor;
  ghostText.style.fontWeight = orginalTextFormat.fontWeight;
  ghostText.style.fontSize = orginalTextFormat.fontSize;
  ghostText.style.fontFamily = orginalTextFormat.fontFamily;
  ghostText.style.textDecoration = orginalTextFormat.textDecoration;
  return ghostText;
}

function getTextFormat(element) {
  return {
    fontColor: element.style.color,
    fontWeight: element.style.fontWeight,
    fontSize: element.style.fontSize,
    fontFamily: element.style.fontFamily,
    textDecoration: element.style.textDecoration,
    fontOpacity: element.style.opacity,
  };
}

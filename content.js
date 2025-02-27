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
  // debounce(() => Suggest(context), 200);
  clearTimeout(timeout);
  timeout = setTimeout(() => Suggest(context), 200);
}

// function debounce(func, delay) {
//   let timeout;
//   return function (...args) {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func.apply(this, ...args), delay);
//   };
// }

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

async function Suggest(context) {
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
    console.log("Adding ghost text");
  });
}

// async function getAutocompleteSuggestion(value, context) {
//   try {
//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "mistralai/mistral-small-24b-instruct-2501:free",
//         messages: [
//           {
//             role: "system",
//             content: `
//           The user has entered the following text: ${value}
//           The context of the text is: ${context}
//           Provide an accurate autocomplete suggestion, matching the context, intended tone, and length of the text.
//           Nothing more or less. If a starting space is needed, add one. Complete in same language as text.
//           If it the text is nonsensical, return nothing.
//           `,
//           },
//         ],
//       }),
//     });

//     const data = await response.json();
//     console.log("data", data);
//     if (data.error) return null;
//     if (data.choices.length === 0) return null;
//     if (data.choices[0].message.content === "null") return null; // Nonsensical user input, return nothing
//     const suggestion = data.choices[0].message.content;
//     return suggestion;
//   } catch (error) {
//     console.error("Error getting autocomplete suggestion:", error);
//     return null;
//   }
// }

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

// debug.js
export default class debugConsole {
  static log(...message) {
    this.#console_out("log", ...message);
  }
  static warn(...message) {
    this.#console_out("warn", ...message);
  }
  static error(...message) {
    this.#console_out("error", ...message);
  }
  static info(...message) {
    this.#console_out("info", ...message);
  }
  static async #console_out(level, ...message) {
    // Log in the background console
    console[level](...message);

    // Log in the foreground console via message passing
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "Debug", message, level });
    }
  }
}

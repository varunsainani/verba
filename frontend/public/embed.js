(function () {
  "use strict";
  var script = document.currentScript;
  if (!script) return;
  var token = script.getAttribute("data-verba-token");
  if (!token) {
    console.warn("[Verba] Missing data-verba-token on the embed script.");
    return;
  }
  var lang = script.getAttribute("data-lang") || "";
  var accent = script.getAttribute("data-color") || "#4f46e5";
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (e) {
    return;
  }
  var widgetUrl =
    origin + "/widget/" + encodeURIComponent(token) + (lang ? "?lang=" + encodeURIComponent(lang) : "");

  var open = false;

  // Floating launcher button
  var button = document.createElement("button");
  button.setAttribute("aria-label", "Chat");
  button.style.cssText = [
    "position:fixed",
    "bottom:20px",
    "right:20px",
    "width:56px",
    "height:56px",
    "border-radius:9999px",
    "border:none",
    "cursor:pointer",
    "background:" + accent,
    "box-shadow:0 8px 24px rgba(0,0,0,0.25)",
    "z-index:2147483000",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "transition:transform .15s ease",
  ].join(";");
  button.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  // Iframe container
  var frameWrap = document.createElement("div");
  frameWrap.style.cssText = [
    "position:fixed",
    "bottom:88px",
    "right:20px",
    "width:380px",
    "max-width:calc(100vw - 32px)",
    "height:560px",
    "max-height:calc(100vh - 120px)",
    "border-radius:16px",
    "overflow:hidden",
    "box-shadow:0 16px 48px rgba(0,0,0,0.3)",
    "z-index:2147483000",
    "display:none",
    "background:#fff",
  ].join(";");

  var iframe = document.createElement("iframe");
  iframe.src = widgetUrl;
  iframe.setAttribute("title", "Verba assistant");
  iframe.style.cssText = "width:100%;height:100%;border:none;";
  frameWrap.appendChild(iframe);

  function render() {
    frameWrap.style.display = open ? "block" : "none";
    button.innerHTML = open
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  button.addEventListener("click", function () {
    open = !open;
    render();
  });

  function mount() {
    document.body.appendChild(frameWrap);
    document.body.appendChild(button);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();

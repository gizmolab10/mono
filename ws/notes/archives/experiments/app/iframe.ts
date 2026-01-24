export function setupIframe(app) {
  const iframe = document.createElement("iframe");
  iframe.src = "https://webseriously.netlify.app/?db=bubble";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.style.overflow = "hidden";
  app.instance.canvas.appendChild(iframe);
  app.instance.data.iframe = iframe;

  window.addEventListener("message", (event) => {
    if (event.data?.type === "listening") {
      app.instance.data.iframeListening = true;
    }
  });
}
export function startHydrationWatcher(app) {
  if (app.instance.data._hydrationTimer) return;

  app.instance.data._hydrationTimer = setInterval(async () => {
    const list = app.properties.objects_table;
    if (!list || typeof list.length !== "function") return;

    const length = list.length();
    if (length === 0) return;

    const first = await list.get(0);
    if (first && app.instance.data.iframeListening) {
      clearInterval(app.instance.data._hydrationTimer);
      app.instance.data._hydrationTimer = null;
      app.instance.data.dataIsReady = true;
      app.publish("data_is_ready", true);
      app.sendToIframe({ type: "hydrated" });
    }
  }, 500);
}

import { setupIframe } from "./iframe";
import { extract } from "./extract";

export const pluginApp = {
  instance: null,
  properties: null,
  context: null,

  init(instance, properties, context) {
    this.instance = instance;
    this.properties = properties;
    this.context = context;

    setupIframe(this);
  },

  update(properties) {
    this.properties = properties;
    extract(this);
  },

  publish(key, value) {
    this.instance?.publishState(key, value);
  },

  sendToIframe(message) {
    this.instance?.data.iframe?.contentWindow?.postMessage(message, "*");
  }
};
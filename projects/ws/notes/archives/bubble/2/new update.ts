function(instance, properties) {
  console.log("[PLUGIN] Updating plugin with new properties:", properties);
  
  // Deep clean the properties object - remove ALL functions and non-serializable data
  function deepClean(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (typeof obj === 'function') return undefined; // Remove functions
    
    if (Array.isArray(obj)) {
      return obj.map(item => deepClean(item)).filter(item => item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = deepClean(value);
        if (cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
    
    return undefined;
  }
  
  const cleanProperties = deepClean(properties);
  
  const message = {
    type: 'UPDATE_PROPERTIES',
    properties: cleanProperties
  };
  
  // Store the message if iframe isn't ready
  if (!instance.data.iframe || !instance.data.iframe.contentWindow) {
    instance.data.pendingMessages = instance.data.pendingMessages || [];
    instance.data.pendingMessages.push(message);
    return;
  }
  
  // Send immediately if iframe is ready
  try {
    instance.data.iframe.contentWindow.postMessage(message, '*');
  } catch (error) {
    console.error("[PLUGIN] Failed to post message to iframe:", error);
  }
}
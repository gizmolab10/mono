type Listener = (...args: unknown[]) => void;

class Event_Bridge {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]) {
    this.listeners.get(event)?.forEach(listener => listener(...args));
  }
}

export const eventBridge = new Event_Bridge();

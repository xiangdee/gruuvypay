// src/services/eventBus.ts
type Listener = (...args: any[]) => void;

const listeners: Record<string, Listener[]> = {};

export const eventBus = {
  on(event: string, fn: Listener) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
    return () => eventBus.off(event, fn);
  },

  off(event: string, fn: Listener) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((l) => l !== fn);
  },

  emit(event: string, ...args: any[]) {
    listeners[event]?.forEach((fn) => fn(...args));
  },
};

export const EVENTS = {
  BENEFICIARIES_UPDATED: 'beneficiaries:updated',
} as const;

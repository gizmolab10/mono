import { writable } from 'svelte/store';

const STORAGE_KEY = 'civ2-regard';

function loadRegard(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 0;
}

function createRegardStore() {
  const { subscribe, update, set } = writable(loadRegard());

  subscribe(value => {
    localStorage.setItem(STORAGE_KEY, String(value));
  });

  return {
    subscribe,
    earn(amount: number) {
      update(current => current + amount);
    },
    reset() {
      set(0);
    }
  };
}

export const regard = createRegardStore();

import { writable } from 'svelte/store';

export interface Need {
  id: string;
  text: string;
  votes: number;
  addedBy: string;
}

const STORAGE_KEY = 'civ2-needs';

function loadNeeds(): Need[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return [
    { id: '1', text: 'A place where everyone feels welcome', votes: 3, addedBy: 'community' },
    { id: '2', text: 'Tools for resolving disagreements peacefully', votes: 2, addedBy: 'community' },
    { id: '3', text: 'A way to share skills and learn from each other', votes: 5, addedBy: 'community' },
    { id: '4', text: 'Clean water and food for every neighborhood', votes: 4, addedBy: 'community' },
    { id: '5', text: 'A garden that anyone can tend', votes: 1, addedBy: 'community' },
  ];
}

function createNeedsStore() {
  const { subscribe, update } = writable(loadNeeds());

  subscribe(value => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  });

  return {
    subscribe,
    vote(id: string) {
      update(needs => needs.map(need =>
        need.id === id ? { ...need, votes: need.votes + 1 } : need
      ));
    },
    add(text: string, addedBy: string) {
      update(needs => [...needs, {
        id: String(Date.now()),
        text,
        votes: 0,
        addedBy
      }]);
    }
  };
}

export const needs = createNeedsStore();

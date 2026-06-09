/**
 * Vitest setup file
 * Mocks browser APIs not available in Node
 */

// Mock localStorage
const store: Record<string, string> = {};

global.localStorage = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, value: string) => { store[key] = value; },
	removeItem: (key: string) => { delete store[key]; },
	clear: () => { Object.keys(store).forEach(k => delete store[k]); },
	key: (index: number) => Object.keys(store)[index] ?? null,
	length: 0,
};

Object.defineProperty(global.localStorage, 'length', {
	get: () => Object.keys(store).length,
});

// Bridge the env var into the persisted flag so test gating reads the same
// source of truth as the running app. Set USE_UNIFACE_RULES=true to skip
// the Group B tests that pin the abandoned placement algorithm.
if (process.env.USE_UNIFACE_RULES === 'true') {
	store['di:useUnifaceRules'] = 'true';
}

// Browser storage stood in for node, installed the moment this is imported.
//
// The database registry is built as soon as it is imported, and it reads browser
// storage while building — so this has to be in place first. A test file that
// imports this before anything else gets a registry that works.

class Mock_Storage {
	private map = new Map<string, string>();
	getItem(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null; }
	setItem(key: string, value: string): void { this.map.set(key, value); }
	removeItem(key: string): void { this.map.delete(key); }
	clear(): void { this.map.clear(); }
}

(globalThis as any).localStorage = new Mock_Storage();

export function clear_storage(): void {
	(globalThis as any).localStorage.clear();
}

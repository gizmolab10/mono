// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — USER CONSTANTS
// Global named values usable in any formula across all SOs.
// Stored in localStorage, keyed by name, values in mm.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'di:standardDimensions';

/** Reserved object id for constant references in the AST. */
export const CONSTANTS_ID = '$std';

export type ConstantEntry = { name: string; value_mm: number };

class Constants {

	private dimensions: Map<string, number> = new Map();

	constructor() {
		this.load();
	}

	// ── query ──

	has(name: string): boolean {
		return this.dimensions.has(name);
	}

	get(name: string): number {
		return this.dimensions.get(name) ?? 0;
	}

	get_all(): ConstantEntry[] {
		return Array.from(this.dimensions.entries()).map(([name, value_mm]) => ({ name, value_mm }));
	}

	// ── mutate ──

	set(name: string, value_mm: number): void {
		this.dimensions.set(name, value_mm);
		this.save();
	}

	rename(old_name: string, new_name: string): void {
		const value = this.dimensions.get(old_name);
		if (value === undefined) return;
		this.dimensions.delete(old_name);
		if (new_name) this.dimensions.set(new_name, value);
		this.save();
	}

	add(name: string, value_mm: number): void {
		this.dimensions.set(name, value_mm);
		this.save();
	}

	remove(name: string): void {
		this.dimensions.delete(name);
		this.save();
	}

	clear(): void {
		this.dimensions.clear();
		this.save();
	}

	// ── persistence ──

	private load(): void {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const entries: ConstantEntry[] = JSON.parse(raw);
			for (const entry of entries) {
				if (entry.name) this.dimensions.set(entry.name, entry.value_mm);
			}
		} catch { /* ignore corrupt data */ }
	}

	private save(): void {
		const entries: ConstantEntry[] = this.get_all();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
	}
}

export const constants = new Constants();

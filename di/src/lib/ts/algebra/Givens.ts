// ═══════════════════════════════════════════════════════════════════
// ALGEBRA — GIVENS
// Global named values usable in any formula across all SOs.
// Stored in localStorage, keyed by name, values in mm.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'di:standardDimensions';

/** Reserved object id for given references in the AST. */
export const GIVENS_ID = '$std';

// value_mm holds mm for a measurement constant, or the raw number for a pure
// scalar (is_scalar true). is_scalar is optional/absent on older data → treated
// as a measurement, so existing constants are unchanged.
export type Portable_Given = { name: string; value_mm: number; locked?: boolean; is_scalar?: boolean };

interface Given { value_mm: number; locked: boolean; is_scalar: boolean }

class Givens {

	private dimensions: Map<string, Given> = new Map();

	constructor() {
		this.load();
	}

	// ── query ──

	has(name: string): boolean {
		return this.dimensions.has(name);
	}

	get(name: string): number {
		return this.dimensions.get(name)?.value_mm ?? 0;
	}

	is_locked(name: string): boolean {
		return this.dimensions.get(name)?.locked ?? false;
	}

	is_scalar(name: string): boolean {
		return this.dimensions.get(name)?.is_scalar ?? false;
	}

	get_all(): Portable_Given[] {
		return Array.from(this.dimensions.entries()).map(([name, v]) => {
			return { name, value_mm: v.value_mm, locked: v.locked, is_scalar: v.is_scalar };
		});
	}

	// ── mutate ──

	// is_scalar is optional: when omitted (e.g. a formula re-writes a constant's
	// number during propagation), keep the constant's existing kind instead of
	// silently reverting it to a measurement.
	set(name: string, value_mm: number, is_scalar?: boolean): void {
		const existing = this.dimensions.get(name);
		this.dimensions.set(name, {
			value_mm,
			locked: existing?.locked ?? true,
			is_scalar: is_scalar ?? existing?.is_scalar ?? false,
		});
		this.save();
	}

	set_locked(name: string, locked: boolean): void {
		const existing = this.dimensions.get(name);
		if (!existing) return;
		existing.locked = locked;
		this.save();
	}

	rename(old_name: string, new_name: string): void {
		const existing = this.dimensions.get(old_name);
		if (!existing) return;
		this.dimensions.delete(old_name);
		if (new_name) this.dimensions.set(new_name, existing);
		this.save();
	}

	add(name: string, value_mm: number, is_scalar: boolean = false): void {
		this.dimensions.set(name, { value_mm, locked: true, is_scalar });
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
			const entries: Portable_Given[] = JSON.parse(raw);
			for (const entry of entries) {
				if (entry.name) this.dimensions.set(entry.name, { value_mm: entry.value_mm, locked: entry.locked ?? true, is_scalar: entry.is_scalar ?? false });
			}
		} catch { /* ignore corrupt data */ }
	}

	private save(): void {
		try {
			const entries: Portable_Given[] = this.get_all();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
		} catch { /* no localStorage in test/SSR */ }
	}
}

export const givens = new Givens();

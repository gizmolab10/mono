/**
 * Deterministic seeded pseudo-random number generator.
 *
 * A small linear congruential generator. Same seed in, same sequence out.
 * Period is 2^32, which is more than enough for the few-hundred-iteration
 * stochastic-finish loop in the dimension-placement search (see rule 21
 * of the dimensionals redesign spec).
 *
 * Use this — and never `Math.random()` — anywhere the result has to be
 * reproducible across runs of the same scene at the same view.
 *
 * Parameters from Numerical Recipes. Wraparound is via `Math.imul` plus
 * `>>> 0`, which keeps the state as an unsigned 32-bit integer.
 */
export class Seeded_Random {
	private state: number;

	/** Accepts a 32-bit unsigned seed OR a string (hashed via FNV-1a). */
	constructor(seed: number | string) {
		this.state = (typeof seed === 'string') ? Seeded_Random.hash_string(seed) : (seed >>> 0);
		// A state of zero locks the LCG at zero — bump it.
		if (this.state === 0) this.state = 1;
	}

	/** Next value, uniform in [0, 1). */
	next(): number {
		this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
		return this.state / 0x100000000;
	}

	/** Next integer, uniform in [0, max). Throws if max <= 0. */
	next_int(max: number): number {
		if (max <= 0) throw new Error(`Seeded_Random.next_int needs max > 0; got ${max}`);
		return Math.floor(this.next() * max);
	}

	/** Pick a uniformly random element from an array. Throws on empty. */
	pick_one<T>(items: readonly T[]): T {
		if (items.length === 0) throw new Error('Seeded_Random.pick_one needs a non-empty array');
		return items[this.next_int(items.length)];
	}

	/** Hash a string into a 32-bit unsigned integer (FNV-1a). */
	static hash_string(s: string): number {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = Math.imul(h, 0x01000193);
		}
		return h >>> 0;
	}
}

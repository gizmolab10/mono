/**
 * Per-phase wall-clock timer for the dimension-placement search.
 *
 * Phase 2 of the dimensionals redesign wraps each algorithm phase
 * (collect, pair-check tiers, greedy, repair, stochastic finish,
 * persistence-viability check) with start/stop calls. The timer keeps
 * the most recent duration and a running average per phase so the
 * performance tests and a dev-mode breakdown can read them.
 *
 * Use `performance.now()` at phase boundaries, NOT inside hot inner
 * loops — the overhead would dominate the very thing being measured.
 *
 * Reads via the methods below; writes through `start(phase)` and
 * `stop(phase)`. The exported singleton `perf_timer` is the one
 * everyone shares; tests reset it via `reset()`.
 */
export class Performance_Timer {
	private state    = new Map<string, number>();
	private last_ms  = new Map<string, number>();
	private avg_ms   = new Map<string, number>();
	private counters = new Map<string, number>();

	/** Mark the start of a phase. Pair with `stop(phase)`. */
	start(phase: string): void {
		this.state.set(phase, performance.now());
	}

	/** Mark the end of a phase. Records the elapsed time and updates the running average. */
	stop(phase: string): void {
		const start = this.state.get(phase);
		if (start === undefined) return;
		const ms = performance.now() - start;
		this.state.delete(phase);
		this.last_ms.set(phase, ms);
		const counter = (this.counters.get(phase) ?? 0) + 1;
		this.counters.set(phase, counter);
		const prev_avg = this.avg_ms.get(phase) ?? 0;
		this.avg_ms.set(phase, prev_avg + (ms - prev_avg) / counter);
	}

	/** Duration of the most recent stop, in milliseconds. Returns 0 if the phase has never run. */
	last(phase: string): number {
		return this.last_ms.get(phase) ?? 0;
	}

	/** Running average across every stop for this phase, in milliseconds. Returns 0 if the phase has never run. */
	average(phase: string): number {
		return this.avg_ms.get(phase) ?? 0;
	}

	/** Per-phase breakdown for dev-mode inspection. */
	breakdown(): { phase: string; last_ms: number; avg_ms: number; count: number }[] {
		const phases = new Set<string>([...this.last_ms.keys(), ...this.avg_ms.keys()]);
		return Array.from(phases).sort().map(p => ({
			phase: p,
			last_ms: this.last_ms.get(p) ?? 0,
			avg_ms: this.avg_ms.get(p) ?? 0,
			count: this.counters.get(p) ?? 0,
		}));
	}

	/** Clear every phase. Used by tests and on full scene reload. */
	reset(): void {
		this.state.clear();
		this.last_ms.clear();
		this.avg_ms.clear();
		this.counters.clear();
	}
}

export const perf_timer = new Performance_Timer();

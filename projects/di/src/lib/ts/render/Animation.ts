type T_Tick_Callback = (dt: number) => void;

class Animation {
	private callbacks: T_Tick_Callback[] = [];
	private last_time = 0;
	private running = false;

	start(): void {
		if (this.running) return;
		this.running = true;
		this.last_time = performance.now();
		this.loop();
	}

	stop(): void {
		this.running = false;
	}

	/** Stop and clear all callbacks (for HMR re-mount). */
	reset(): void {
		this.running = false;
		this.callbacks = [];
	}

	on_tick(callback: T_Tick_Callback): void {
		this.callbacks.push(callback);
	}

	private loop = (): void => {
		if (!this.running) return;

		const now = performance.now();
		const dt = (now - this.last_time) / 1000;
		this.last_time = now;

		// Run each frame callback in its own guard. If one throws, log it and
		// move on — never let a single bad frame stop the next from being asked
		// for. Before this guard, a throw here skipped the request below and the
		// whole screen loop died until a page refresh.
		for (const cb of this.callbacks) {
			try {
				cb(dt);
			} catch (e) {
				console.error('A drawing step threw this frame. Skipping it and keeping the screen loop alive so the canvas can recover.', e);
			}
		}

		requestAnimationFrame(this.loop);
	};
}

export const animation = new Animation();

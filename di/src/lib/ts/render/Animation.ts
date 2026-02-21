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

		for (const cb of this.callbacks) {
			cb(dt);
		}

		requestAnimationFrame(this.loop);
	};
}

export const animation = new Animation();

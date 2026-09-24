import { writable, get } from 'svelte/store';

export type Status_Kind = 'default' | 'error';

export interface Status_Message {
	text: string;
	kind: Status_Kind;
}

class Status {

	w_queue = writable<Status_Message[]>([]);

	get current(): Status_Message | null {
		const queue = get(this.w_queue);
		return queue.length > 0 ? queue[0] : null;
	}

	get is_visible(): boolean {
		return this.current !== null;
	}

	/** Publish a message. Default-kind unless an explicit kind is given.
	 *  If the message exactly matches the currently shown message or the
	 *  back of the queue, the publish is a no-op (dedup). */
	show(text: string, kind: Status_Kind = 'default'): void {
		const queue = get(this.w_queue);
		const current = queue[0] ?? null;
		const back = queue[queue.length - 1] ?? null;
		const incoming: Status_Message = { text, kind };
		if (current && current.text === text && current.kind === kind) return;
		if (back && back.text === text && back.kind === kind) return;
		this.w_queue.set([...queue, incoming]);
	}

	/** Dismiss the front of the queue. The next queued message becomes
	 *  the current one; if the queue is empty after dismissal, the
	 *  strip becomes invisible. No-op when nothing is shown. */
	dismiss(): void {
		const queue = get(this.w_queue);
		if (queue.length === 0) return;
		this.w_queue.set(queue.slice(1));
	}

	/** Empty the entire queue. The strip becomes invisible. */
	clear(): void {
		this.w_queue.set([]);
	}

}

export const status = new Status();

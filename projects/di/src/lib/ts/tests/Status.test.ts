import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { status } from '../managers/Status';

beforeEach(() => {
	status.clear();
});

describe('the status strip store', () => {

	it('is empty by default and the strip is invisible', () => {
		expect(get(status.w_queue)).toEqual([]);
		expect(status.current).toBeNull();
		expect(status.is_visible).toBe(false);
	});

	it('publishing a message when none is shown puts it at the front and the strip becomes visible', () => {
		status.show('first');
		expect(status.current).toEqual({ text: 'first', kind: 'default' });
		expect(status.is_visible).toBe(true);
	});

	it('publishing a second message while one is shown puts the second at the back; the first stays at the front', () => {
		status.show('first');
		status.show('second');
		const queue = get(status.w_queue);
		expect(queue).toHaveLength(2);
		expect(queue[0].text).toBe('first');
		expect(queue[1].text).toBe('second');
		expect(status.current!.text).toBe('first');
	});

	it('dismiss removes the front; the next queued message becomes the front', () => {
		status.show('first');
		status.show('second');
		status.dismiss();
		expect(status.current!.text).toBe('second');
		expect(get(status.w_queue)).toHaveLength(1);
	});

	it('dismiss when only one message is shown empties the queue and the strip becomes invisible', () => {
		status.show('only');
		status.dismiss();
		expect(status.current).toBeNull();
		expect(status.is_visible).toBe(false);
	});

	it('dismiss when no message is shown is a no-op', () => {
		status.dismiss();
		expect(status.current).toBeNull();
	});

	it('clear empties the entire queue, including queued messages', () => {
		status.show('first');
		status.show('second');
		status.show('third');
		status.clear();
		expect(get(status.w_queue)).toEqual([]);
		expect(status.is_visible).toBe(false);
	});

	it('error-kind and default-kind messages survive queueing with their kind preserved', () => {
		status.show('boom', 'error');
		status.show('ok', 'default');
		const queue = get(status.w_queue);
		expect(queue[0].kind).toBe('error');
		expect(queue[1].kind).toBe('default');

		status.dismiss();
		expect(status.current!.kind).toBe('default');
	});

	it('publishing a message that exactly matches the currently shown message is a no-op', () => {
		status.show('hello');
		status.show('hello');
		expect(get(status.w_queue)).toHaveLength(1);
	});

	it('publishing a message that exactly matches the back of the queue is a no-op', () => {
		status.show('first');
		status.show('second');
		status.show('second');
		expect(get(status.w_queue)).toHaveLength(2);
	});

	it('publishing the same message a hundred times leaves the queue with at most one copy', () => {
		for (let i = 0; i < 100; i++) {
			status.show('repeat');
		}
		expect(get(status.w_queue)).toHaveLength(1);
	});

	it('two messages that differ only by kind are treated as distinct (not deduped)', () => {
		status.show('hello', 'default');
		status.show('hello', 'error');
		expect(get(status.w_queue)).toHaveLength(2);
	});

});

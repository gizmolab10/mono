<script lang="ts">
	import { onMount } from 'svelte';
	const maxLines = 100;
	let messages: string[] = ["[DEBUG] Console Initialized"];
	let dragging = false;
	let offsetX = 0;
	let offsetY = 0;
	let nextId = 1;
	let right = 20;
	let top = 20;

	function stopDrag() { dragging = false; }
	function clear() { messages = ["[DEBUG] Console Cleared"]; }
	function copy(text: string) { navigator.clipboard.writeText(text); }
	function log(message: string) { messages = [...messages, message].slice(-maxLines); }

	onMount(() => {
		const handler = (e: MessageEvent) => {
			try {
				const origin = e.origin.replace(/^https?:\/\//, '');
				const type = e.data?.type || "UNKNOWN";
				const pretty = JSON.stringify(e.data, null, 2);
				log(`[MSG from ${origin} | ${type}]\n${pretty}`);
			} catch (err) {
				log(`[ERROR parsing message] ${err}`);
			}
		};
		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	});

	function startDrag(event: MouseEvent) {
		u.isolateEvent(event);
		offsetX = event.clientX;
		offsetY = event.clientY;
		dragging = true;
	}

	function onDrag(event: MouseEvent) {
		if (dragging) {
			const dx = event.clientX - offsetX;
			const dy = event.clientY - offsetY;
			offsetX = event.clientX;
			offsetY = event.clientY;
			right -= dx;
			top -= dy;
		}
	}
</script>

<div
	class="overlay"
	on:mousemove={onDrag}
	on:mouseup={stopDrag}
	on:mouseleave={stopDrag}
	style="top: {top}px; right: {right}px">
	<div class="drag-handle" on:mousedown={startDrag}>
		[ BUBBLE DEBUG ]
	</div>
	<button class="clear-button" on:click={clear}>clear</button>
	{#each messages as msg}
		<div class="entry">
			{msg}
			<button class="copy-button" on:click={() => copy(msg)}>📋</button>
		</div>
	{/each}
</div>

<style>
	.overlay {
		right: 0;
		bottom: 0;
		color: #0f0;
		width: 400px;
		z-index: 99999;
		position: fixed;
		font-size: 12px;
		overflow-y: auto;
		max-height: 100px;
		white-space: pre-wrap;
		font-family: monospace;
		padding: 8px 24px 8px 8px;
		border-top-left-radius: 8px;
		background-color: rgba(0, 0, 0, 0.85);
	}

	.clear-button {
		top: 4px;
		right: 6px;
		color: #ccc;
		border: none;
		cursor: pointer;
		font-size: 14px;
		font-weight: bold;
		position: absolute;
		background: transparent;
	}

	.copy-button {
		color: #ccc;
		border: none;
		font-size: 11px;
		cursor: pointer;
		margin-left: 6px;
		background: transparent;
	}

	.drag-handle {
		color: #aaa;
		padding: 4px;
		cursor: move;
		font-size: 11px;
		font-weight: bold;
		margin-bottom: 6px;
		border-bottom: 1px solid #333;
		background: rgba(255, 255, 255, 0.05);
	}

	.entry {
		margin-bottom: 6px;
		padding-bottom: 4px;
		border-bottom: 1px solid #333;
	}
</style>

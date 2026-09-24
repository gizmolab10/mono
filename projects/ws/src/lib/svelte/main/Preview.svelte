<script lang='ts'>
	import { h, k, u, show, files, colors, Point } from '../../ts/common/Global_Imports';
	import DB_Filesystem from '../../ts/database/DB_Filesystem';
	import Close_Button from '../mouse/Close_Button.svelte';
	const { w_id_popupView } = show;
	const { w_preview_content, w_preview_type, w_preview_filename } = files;
	const { w_background_color } = colors;
	let copyFeedback = '';

	function dismiss_popup() {
		$w_id_popupView = null;
		$w_preview_content = null;
	}

	async function downloadFile() {
		if (!(h.db instanceof DB_Filesystem)) return;
		const thing = h.things.find(t => t.title === $w_preview_filename);
		if (thing) {
			await h.db.downloadFile(thing.id);
		}
	}

	async function copyPath() {
		if (!(h.db instanceof DB_Filesystem)) return;
		const thing = h.things.find(t => t.title === $w_preview_filename);
		if (thing) {
			const success = await h.db.copyPath(thing.id);
			copyFeedback = success ? 'Copied!' : 'Failed';
			setTimeout(() => copyFeedback = '', 1500);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			dismiss_popup();
		}
	}
</script>

<svelte:document on:keydown={handleKeydown}/>

<div class='preview-overlay'
	on:keyup={u.ignore}
	on:keydown={u.ignore}
	on:click={dismiss_popup}>
	<div class='preview-content'
		style='background-color:{$w_background_color}'
		on:click|stopPropagation>
		<div class='top-bar'>
			<span class='title'>{$w_preview_filename}</span>
		</div>
		<div class='close-wrapper' on:click={dismiss_popup}>
			<Close_Button
				name='preview-close'
				size={k.height.dot * 1.5}
				closure={dismiss_popup}
				origin={new Point(0, 0)}/>
		</div>
		{#if h.db instanceof DB_Filesystem}
			<div class='button-bar'>
				<button on:click={copyPath}>
					{copyFeedback || 'Copy Path'}
				</button>
				<button on:click={downloadFile}>
					Download
				</button>
			</div>
		{/if}
		<div class='preview-body'>
			{#if $w_preview_type === 'image' && $w_preview_content}
				<img src={$w_preview_content} alt='Preview'/>
			{:else if $w_preview_type === 'text' && $w_preview_content}
				<pre>{$w_preview_content}</pre>
			{:else}
				<p>{$w_preview_content}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.preview-overlay {
		background-color: rgba(0, 0, 0, 0.1);
		justify-content: center;
		align-items: center;
		position: fixed;
		display: flex;
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
	}
	.preview-content {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		background-color: #fff;
		border-radius: 4px;
		position: absolute;
		max-height: 80vh;
		max-width: 80vw;
		font-size: 0.8em;
		padding: 20px;
		overflow: auto;
	}
	.top-bar {
		justify-content: center;
		align-items: center;
		display: flex;
		gap: 10px;
	}
	.close-wrapper {
		position: absolute;
		cursor: pointer;
		right: 8px;
		top: 8px;
	}
	.title {
		font-size: 1.5em;
	}
	.button-bar {
		justify-content: center;
		margin-top: 10px;
		display: flex;
		gap: 10px;
	}
	.button-bar button {
		padding: 4px 12px;
		border-radius: 4px;
		cursor: pointer;
		border: 1px solid #ccc;
		background: #f5f5f5;
	}
	.button-bar button:hover {
		background: #e5e5e5;
	}
	.preview-body {
		margin-top: 15px;
	}
	.preview-body img {
		max-width: 100%;
		max-height: 70vh;
	}
	.preview-body pre {
		white-space: pre-wrap;
		font-family: monospace;
		max-height: 70vh;
		font-size: 12px;
		overflow: auto;
	}
</style>

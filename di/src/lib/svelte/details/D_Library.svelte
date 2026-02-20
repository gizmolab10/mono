<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { scenes } from '../../ts/managers';
	import { engine } from '../../ts/render';

	type LibEntry = { name: string; size: string; raw: string };

	function format_size(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	let entries: LibEntry[] = $state([]);

	async function refresh(): Promise<void> {
		const files = await scenes.list_library();
		entries = files.map(f => ({
			name: f.name,
			size: format_size(new Blob([f.raw]).size),
			raw: f.raw,
		}));
	}

	refresh();

	function on_click(entry: LibEntry, e: MouseEvent): void {
		if (e.altKey) {
			engine.insert_child_from_text(entry.raw);
			return;
		}
		scenes.load_from_text(entry.raw);
	}

	async function add_to_library(): Promise<void> {
		await scenes.add_to_library();
		refresh();
	}
</script>

<table class='library'><tbody>
	{#each entries as entry}
		<tr class='lib-row' onclick={(e) => on_click(entry, e)}>
			<td class='lib-name'>{entry.name}</td>
			<td class='lib-size'>{entry.size}</td>
		</tr>
	{/each}
</tbody></table>

<hr />

<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'import', onpress: () => scenes.import_from_file() }}>import</button>
	<button class='action-btn save' use:hit_target={{ id: 'add-to-lib', onpress: () => add_to_library() }}>save</button>
</div>

<style>
	hr {
		border     : none;
		border-top : 0.5px solid currentColor;
		opacity    : 0.3;
		margin     : 8px 0;
	}

	.settings {
		display : flex;
		gap     : 6px;
	}

	.action-btn {
		border        : 0.5px solid currentColor;
		box-sizing    : border-box;
		cursor        : pointer;
		color         : inherit;
		background    : white;
		padding       : 0 8px;
		border-radius : 10px;
		font-size     : 11px;
		height        : 20px;
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.save {
		margin-left : auto;
	}

	.library {
		width           : 100%;
		border-collapse : collapse;
		font-size       : 11px;
	}

	.lib-row {
		cursor : pointer;
	}

	.lib-row:hover {
		background : var(--accent);
	}

	.lib-name {
		padding    : 2px 0;
		text-align : left;
	}

	.lib-size {
		padding    : 2px 0;
		text-align : right;
		opacity    : 0.5;
	}
</style>

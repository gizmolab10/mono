<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/managers/Hits';
	import { scenes, stores } from '../../ts/managers';
	import { engine } from '../../ts/render';
	import { tick } from 'svelte';

	const { w_library } = stores;

	type LibEntry = { name: string; folder: string; display: string };

	let active_folder: string = $state(preferences.read<string>(T_Preference.libraryFolder) ?? '');

	function parse_names(names: string[]): LibEntry[] {
		return names.map(name => {
			const slash = name.indexOf('/');
			return {
				name,
				folder: slash === -1 ? '' : name.slice(0, slash),
				display: slash === -1 ? name : name.slice(slash + 1),
			};
		});
	}

	// instant: bundled names are synchronous
	let entries: LibEntry[] = $state(parse_names(scenes.list_bundled()));

	let folders: string[] = $derived([...new Set(entries.map(e => e.folder))].sort((a, b) => a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));
	let visible: LibEntry[] = $derived(entries.filter(e => e.folder === active_folder));

	// async: merge IDB user files, then validate active_folder
	async function merge_idb(): Promise<void> {
		const all = await scenes.list_library();
		entries = parse_names(all);
		if (!entries.some(e => e.folder === active_folder)) {
			active_folder = folders[0] ?? '';
		}
		await tick();
		hits.recalibrate();
	}

	merge_idb();

	// react to library changes (e.g. save from Controls)
	$effect(() => { $w_library; merge_idb(); });

	async function reset_library(): Promise<void> {
		await scenes.clear_idb();
		entries = parse_names(scenes.list_bundled());
		await merge_idb();
	}

	async function on_click(entry: LibEntry, e: MouseEvent): Promise<void> {
		const raw = await scenes.load_library_file(entry.name);
		if (!raw) return;
		if (e.altKey) {
			engine.insert_child_from_text(raw);
			return;
		}
		const parsed = scenes.parse_text(raw);
		if (parsed) engine.load_scene(parsed);
	}

</script>

{#if folders.length > 1}
	<div class='segmented'>
		{#each folders as folder}
			<button
				class:active={active_folder === folder}
				onclick={() => { active_folder = folder; preferences.write(T_Preference.libraryFolder, folder); }}>
				{folder || 'mine'}
			</button>
		{/each}
	</div>
{/if}

<table class='library'><tbody>
	{#each visible as entry}
		<tr class='lib-row' onclick={(e) => on_click(entry, e)}>
			<td class='lib-name'>{entry.display}</td>
		</tr>
	{/each}
</tbody></table>

<div class='separator'></div>

<div class='settings'>
	<button class='action-btn' use:hit_target={{ id: 'import', onpress: () => scenes.import_from_file((s) => engine.load_scene(s)) }}>import</button>
	<button class='action-btn far-right' use:hit_target={{ id: 'reset-library', onpress: reset_library }}>reinstall</button>
</div>

<style>
	.segmented {
		display         : flex;
		justify-content : center;
		margin-bottom   : 4px;
	}

	.segmented button {
		font-size     : 11px;
		height        : 16px;
		padding       : 0 8px;
		background    : white;
		white-space   : nowrap;
		color         : inherit;
		cursor        : pointer;
		border        : 0.5px solid currentColor;
	}

	.segmented button:first-child {
		border-radius : 10px 0 0 10px;
	}

	.segmented button:last-child {
		border-radius : 0 10px 10px 0;
	}

	.segmented button:not(:first-child) {
		border-left : none;
	}

	.segmented button.active {
		font-weight : 600;
		background  : var(--accent);
	}

	.segmented button:hover:not(.active) {
		background : var(--bg);
	}

	.separator {
		background     : var(--accent);
		margin         : 0 -8px;
		display        : flex;
		flex-direction : column;
		gap            : 2px;
	}

	.separator::before,
	.separator::after {
		content       : '';
		display       : block;
		background    : var(--bg);
	}

	.separator::before {
		height        : 8px;
		border-radius : 0 0 8px 8px;
	}

	.separator::after {
		height        : 8px;
		border-radius : 8px 8px 0 0;
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

	.far-right {
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
</style>

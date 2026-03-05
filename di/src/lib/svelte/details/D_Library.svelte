<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/managers/Hits';
	import { scenes, stores } from '../../ts/managers';
	import { constraints } from '../../ts/algebra/Constraints';
	import { engine } from '../../ts/render';
	import { get } from 'svelte/store';
	import { tick } from 'svelte';
	import Separator from '../mouse/Separator.svelte';

	const { w_library } = stores;

	type LibEntry = { name: string; folder: string; display: string };

	let active_folder: string = $state(preferences.read<string>(T_Preference.libraryFolder) ?? '');
	let selected: LibEntry | null = $state(null);

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
		selected = null;
		await merge_idb();
	}

	// axis start/length attribute names per axis index
	const axis_start = ['x_min', 'y_min', 'z_min'];
	const axis_length = ['width', 'depth', 'height'];

	async function do_replace(): Promise<void> {
		if (!selected) return;
		const raw = await scenes.load_library_file(selected.name);
		if (!raw) return;
		const parsed = scenes.parse_text(raw);
		if (parsed) engine.load_scene(parsed);
	}

	async function do_insert(): Promise<void> {
		if (!selected) return;
		const raw = await scenes.load_library_file(selected.name);
		if (!raw) return;

		const before = new Set(get(stores.w_all_sos).map(s => s.id));
		engine.insert_child_from_text(raw);

		// Find the imported root: a new SO whose parent existed before the insert
		const child_so = get(stores.w_all_sos).find(s => !before.has(s.id) && s.scene?.parent?.so && before.has(s.scene.parent.so.id));
		if (!child_so) return;
		child_so.visible = true;

		// Write .s and .l formulas on the two non-forward axes
		const forward_face = get(stores.w_front_face);
		if (forward_face < 0) return;
		const forward_axis = Math.floor(forward_face / 2);
		const parent_id = child_so.scene?.parent?.so.id;
		for (let i = 0; i < 3; i++) {
			if (i === forward_axis) continue;
			constraints.set_formula(child_so, axis_start[i], '.s', parent_id);
			constraints.set_formula(child_so, axis_length[i], '.l', parent_id);
		}
		constraints.propagate_all();
		stores.tick();
		scenes.save();
	}

</script>

{#if folders.length > 1}
	<div class='segmented'>
		{#each folders as folder}
			<button
				class:active={active_folder === folder}
				onclick={() => { active_folder = folder; preferences.write(T_Preference.libraryFolder, folder); selected = null; }}>
				{folder || 'mine'}
			</button>
		{/each}
	</div>
{/if}

<table class='library'><tbody>
	{#each visible as entry}
		<tr class='lib-row' class:selected={selected === entry} onclick={() => selected = entry}>
			<td class='lib-name'>{entry.display}</td>
		</tr>
	{/each}
</tbody></table>

<Separator />

<div class='settings'>
	<button class='action-btn' disabled={!selected} use:hit_target={{ id: 'lib-replace', onpress: do_replace }}>replace</button>
	<button class='action-btn' disabled={!selected} use:hit_target={{ id: 'lib-insert', onpress: do_insert }}>insert</button>
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
		z-index       : var(--z-action);
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


	.settings {
		flex-wrap : wrap;
		display   : flex;
		gap       : 6px;
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
		z-index       : var(--z-action);
	}

	.action-btn:global([data-hitting]) {
		background : var(--accent);
		color      : black;
	}

	.action-btn:disabled {
		opacity : 0.3;
		cursor  : default;
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

	.lib-row.selected {
		background  : var(--accent);
		font-weight : 600;
	}

	.lib-name {
		padding    : 2px 0;
		text-align : left;
	}
</style>

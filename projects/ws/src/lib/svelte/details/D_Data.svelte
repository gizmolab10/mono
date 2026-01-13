<script lang='ts'>
	import { c, h, k, u, busy, show, colors, details, features, elements, databases } from '../../ts/common/Global_Imports';
	import { T_File_Extension, T_File_Operation, T_Storage_Need } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Hit_Target, T_Request, T_Preference } from '../../ts/common/Global_Imports';
	import { Point, S_Mouse, S_Element } from '../../ts/common/Global_Imports';
	import { T_Database } from '../../ts/database/DB_Common';
	import DB_Filesystem from '../../ts/database/DB_Filesystem';
	import Identifiable from '../../ts/runtime/Identifiable';
	import type { Dictionary } from '../../ts/types/Types';
    import Buttons_Row from '../mouse/Buttons_Row.svelte';
	import Text_Table from '../text/Text_Table.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Button from '../mouse/Button.svelte';
	const { w_t_database, w_data_updated } = databases;
	const { w_show_other_databases, w_show_save_data_button } = show;
    const font_sizes = [k.font_size.instructions, k.font_size.banners];
	const ids_forDirection = [T_File_Operation.import, T_File_Operation.export];
	const ids_forOutputFormat = [T_File_Extension.csv, T_File_Extension.json, T_File_Extension.cancel];
	const s_save = elements.s_element_for(new Identifiable('save'), T_Hit_Target.button, 'save');
	const ids_forDatabase = [T_Database.test, T_Database.docs]
		.concat(DB_Filesystem.isSupported() ? [T_Database.filesystem, T_Database.firebase] : [T_Database.firebase]);
	const ids_forInputFormat = [T_File_Extension.csv, T_File_Extension.json, T_File_Extension.seriously, T_File_Extension.cancel];
	const s_selectFolder = elements.s_element_for(new Identifiable('select-folder'), T_Hit_Target.button, 'select-folder');
	let s_element_dict_byStorageType: Dictionary<S_Element> = {};
	let heights = [15, height_ofChoices(), 42, 28, 74, 26, 3];
	let storage_choice: string | null = null;
	let storage_details: Array<Object> = [];
	let width = k.width.details - 7;
	let reattachments = 0;
	let title = k.empty;

	setup_s_elements();
	$: tops = u.cumulativeSum(heights);
	s_save.set_forHovering('black', 'pointer');
	s_selectFolder.set_forHovering('black', 'pointer');
	$: isFilesystemDB = $w_t_database === T_Database.filesystem;
	function height_ofChoices() { return features.has_every_detail ? $w_show_other_databases ? 18 : -5 : -16; }

	$:{
		const _ = `${$w_data_updated}:::${$w_t_database}`;
		update_storage_details();
	}

	$: {
		const _ = `${details.t_storage_need}:::${$w_show_other_databases}`;
		reattachments++;
	}

	function ids_forFormat(): T_File_Extension[] {
		return (storage_choice == T_File_Operation.import) ? ids_forInputFormat : ids_forOutputFormat;
	}

	async function handle_db_selection(titles: string[]) {
		const t_database = titles[0] as T_Database; // only ever contains one title
		await databases.grand_change_database(t_database);
	}

	async function handle_save(s_mouse) {
		if (!!h && h.hasRoot && s_mouse.isUp) {
			await h.db.persist_all(true);
		}
	}

	async function handle_selectFolder(s_mouse) {
		if (s_mouse.isUp && h.db instanceof DB_Filesystem) {
			await h.db.selectFolder();
			databases.w_data_updated.set(Date.now());
		}
	}

	function handle_show_other_databases(event: Event) {
		show.toggle_show_other_databases();
		heights[1] = height_ofChoices();
		heights = [...heights];	// force a re-render
	}

	function action_titles() {
		switch (details.t_storage_need) {
			case T_Storage_Need.direction: return ['local file', ...ids_forDirection];
			case T_Storage_Need.format:    return ['file type', ...ids_forFormat()];
			case T_Storage_Need.busy:      return [`${storage_choice}ing...`];
		}
	}
	
	function setup_s_elements() {
		const ids = [...ids_forDirection, ...ids_forInputFormat];
		for (const id of ids) {
			const s_storage = elements.s_element_for(null, T_Hit_Target.database, id);
			s_storage.set_forHovering(colors.default, 'pointer');
			s_element_dict_byStorageType[id] = s_storage;
		}
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = (details.t_storage_need == T_Storage_Need.direction) ? ids_forDirection : ids_forFormat();
		switch (t_request) {
			case T_Request.handle_s_mouse: return handle_mouseUp_forColumn(s_mouse, column);
			case T_Request.name:        return ids[column];
			case T_Request.is_visible:  return true;
			default:                    return false;
		}
		return null;
	}

	function update_storage_details() {
		if (!!h) {
			$w_show_save_data_button = h.db.isPersistent && h.total_dirty_count != 0;
			storage_details = [h.db.details_forStorage,
			['depth', h.depth.supressZero()],
			['things', h.things.length.supressZero()],
			['relationships', h.relationships.length.supressZero()],
			['traits', h.traits.length.supressZero()],
			['tags', h.tags.length.supressZero()],
			['must save', h.total_dirty_count.supressZero()]];
		}
	}
	
	function handle_mouseUp_forColumn(s_mouse, column) {
		const beginning = details.t_storage_need == T_Storage_Need.direction;
		const ids = beginning ? ids_forDirection : ids_forFormat();
		if (s_mouse.isDown) {
			const choice = ids[column];
			details.t_storage_need = T_Storage_Need.direction; // reset by default
			if (beginning) {
				storage_choice = choice;
				details.t_storage_need = T_Storage_Need.format; // not reset
			} else if (choice != T_File_Extension.cancel) {
				const format = choice as T_File_Extension;
				switch (storage_choice) {
					case T_File_Operation.export: h.persist_toFile(format); break;
					case T_File_Operation.import: h.select_file_toUpload(format, s_mouse.event.shiftKey); break;
				}
			}
		}
	}

</script>

<div class='database-container'
	style='
		padding:5px;'>
	{#if features.has_every_detail}
		<Separator name='show-other-databases'
			isHorizontal={true}
			has_fillets={true}
			has_double_fillet={true}
			has_thin_divider={false}
			origin={new Point(1, 30)}
			zindex={T_Layer.frontmost + 1}
			length={k.width.details - 2.5}
			thickness={k.thickness.separator.details}
			handle_mouseUp={handle_show_other_databases}
			title='{$w_show_other_databases ? 'hide other databases' : 'show other databases'}'/>
		{#if $w_show_other_databases}
			<Segmented name='databases'
				left={105}
				width={width}
				titles={ids_forDatabase}
				selected={[$w_t_database]}
				height={k.height.controls}
				origin={new Point(0, tops[0])}
				handle_selection={handle_db_selection}/>
		{/if}
	{/if}
	<div class='database-information'
		style='
			width: 100%;
			top={tops[1]}
			position: relative;
			font-size:{k.font_size.banners}px;'>
		<Text_Table name='database-table'
			top={tops[1]}
			row_height={11}
			array={storage_details}
			font_size={k.font_size.banners}/>
		{#key $w_data_updated}
			{#if $w_show_save_data_button && !busy.isDatabaseBusy}
				<Button name='save'
					width=72
					s_button={s_save}
					handle_s_mouse={handle_save}
					zindex={T_Layer.frontmost}
					origin={new Point(120, tops[3])}>
					save to db
				</Button>
			{/if}
			{#if isFilesystemDB}
				<Button name='select-folder'
					width=85
					s_button={s_selectFolder}
					handle_s_mouse={handle_selectFolder}
					zindex={T_Layer.frontmost}
					origin={new Point(110, tops[3])}>
					select folder
				</Button>
			{/if}
		{/key}
	</div>
	{#key reattachments}
		<Buttons_Row
			gap={4}
			margin={20}
			row_name='data'
			width={width + 5}
			has_seperator={true}
			font_sizes={font_sizes}
			row_titles={action_titles()}
			closure={handle_actionRequest}
			button_height={k.height.button}
			center={new Point(width / 2 + 3, tops[4])}
			separator_thickness={k.thickness.separator.details}
			name={`data-${(details.t_storage_need == T_Storage_Need.direction) ? 'action' : 'format'}`}/>
	{/key}
	<Separator name='bottom-of-data'
		isHorizontal={true}
		length={k.width.details + 1.5}
		origin={new Point(-0.6, tops[5])}
		thickness={k.thickness.separator.main}
		corner_radius={k.radius.fillets.thick}/>
</div>

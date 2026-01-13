<script lang='ts'>
	import { T_Layer, T_Detail, T_Action, T_Request, T_Predicate, T_Alteration, T_Hit_Target, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { c, e, g, h, k, core, u, x, show, Point, colors, signals, S_Mouse } from '../../ts/common/Global_Imports';
	import { elements, details, controls } from '../../ts/common/Global_Imports';
	import Buttons_Table from '../mouse/Buttons_Table.svelte';
	import Separator from '../draw/Separator.svelte';
	import Button from '../mouse/Button.svelte';
	export let top = 2;
	const title_gap = 4;
	const has_title = true;
	const { w_t_graph } = show;
	const top_tableHeight = 93;
	const left_afterTitle = 39.5;
	const { w_s_title_edit } = x;
	const bottom_tableHeight = 73;
	const { w_user_graph_offset } = g;
	const { w_background_color } = colors;
	const table_width = k.width.details - 8;
	const { w_items: w_grabbed } = x.si_grabs;
	const { w_items: w_expanded } = x.si_expanded;
	const bottom_padding = bottom_tableHeight - 48;
	const { w_s_alteration, w_ancestry_forDetails } = x;
    const font_sizes = [k.font_size.instructions, k.font_size.instructions];
    const s_banner_hideable = details.s_banner_hideables_dict_byType[T_Detail.actions];
	const s_cancel = elements.s_element_for($w_ancestry_forDetails, T_Hit_Target.cancel, k.empty);
	let list_title = $w_ancestry_forDetails?.isExpanded && controls.inTreeMode ? 'hide list' : 'list';
	let button_titles = compute_button_titles();
	let no_actions = k.nothing_to_show;
	let actions_top = top + 3;
    let reattachments = 0;
	s_cancel.set_forHovering(colors.default, 'pointer');

	//////////////////////////////////////////////////////////////
	//															//
	//  buttons row sends column & T_Request:					//
	// 	  is_disabled calls:	isAction_disabledAt		//
	//	  handle_s_mouse calls:	handle_action_clickedAt ...		//
	//    n.b., long press generates multiple calls				//
	//  buttons table adds row (here it becomes row)			//
	//															//
	//////////////////////////////////////////////////////////////
	
    $:	{
		const _ = top;
		actions_top = top + 3;
	}

	$: {
		const _ = `${u.descriptionBy_titles($w_expanded)}:::${u.descriptionBy_titles($w_grabbed)}`;
		update_button_titles();
	}

	$: {
		const _ = `${$w_s_title_edit?.description}`;
		const while_editing = 'While editing, no actions are available';
		no_actions = !$w_s_title_edit?.isActive ? k.nothing_to_show : while_editing;
	}

	$: {
		const _ = `${$w_user_graph_offset}
		:::${$w_s_title_edit?.description}
		:::${$w_t_graph}
		:::${$w_background_color}
		:::${x.si_found.w_index}
		:::${$w_s_alteration}`;
		reattachments++;
	}

	function row_isAltering(row: number): boolean {
		return [T_Action.add, T_Action.delete].includes(row);
	}

	function handle_cancel(s_mouse: S_Mouse) {
		if (s_mouse.isDown) {
			h.stop_alteration();
		}
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles(): void {
		const ancestry = $w_ancestry_forDetails;
		list_title = controls.inTreeMode && !!ancestry && ancestry.isExpanded ? 'hide list' : 'show list';
		button_titles = compute_button_titles();
		setTimeout(() => reattachments++, 0);
	}

	function group_andIndex(row: number): [number, number] {
		const index = row;
		const group = index < 5 ? 0 : 1;
		const index_withinGroup = index % 5;
		return [group, index_withinGroup];
	}

	function name_for(row: number, column: number): string {
		const [group, index] = group_andIndex(row);
		const titles = button_titles[group][row];
		if (!!titles && titles.length > column) {
			return `${titles[0]}-${titles[column]}`;
		}
		return k.empty;
	}

	function isAction_invertedAt(row: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const t_alteration = s_alteration?.t_alteration;
		return !!t_alteration && !!action && action == e.name_ofActionAt(row, column)
			&& ((row == T_Action.delete && t_alteration == T_Alteration.delete)
			||  (row == T_Action.add    && t_alteration == T_Alteration.add));
	}

	function compute_button_titles() {
		return [
			[['browse', 'left', 'up', 'down', 'right'],
			['focus',   'selection', 'parent of selection'],
			['show',    'selection', `${list_title}`, 'entire graph'],
			['center',  'focus', 'selection', 'graph']],
			[['add',    'child', 'sibling', 'line', 'parent', 'related'],
			['delete',  'selection', 'parent', 'related'],
			['move',    'left', 'up', 'down', 'right']],
		];
	}

	function handle_action_autorepeatAt(s_mouse: S_Mouse, t_action: number, column: number, name: string) {
		const valid_autorepeat = [T_Action.browse, T_Action.move].includes(t_action);
		if (s_mouse.isDown || (s_mouse.isRepeat && valid_autorepeat)) {
			e.handle_action_clickedAt(s_mouse, t_action, column, name);
		}
	}

	function handle_actionRequest(t_request: T_Request, s_mouse: S_Mouse, name: string, row: number, column: number): any {
		if (name == 'bottom-actions') {
			row += 4;
		}
		const isAltering = !!$w_s_alteration;
		switch (t_request) {
			case T_Request.name:		 return e.name_ofActionAt(row, column);
			case T_Request.is_visible:	 return !isAltering ? true : row_isAltering(row);
			case T_Request.is_disabled:  return e.isAction_disabledAt(row, column);
			case T_Request.is_inverted:  return !isAltering ? false : isAction_invertedAt(row, column);
			case T_Request.handle_s_mouse: return handle_action_autorepeatAt(s_mouse, row, column, name_for(row, column + 1));
		}
		return null;
	}

</script>

{#key reattachments}
	{#if !$w_grabbed || $w_grabbed.length == 0 || $w_s_title_edit?.isActive}
		<div class='no-actions'>
			<p style='user-select:none; text-align:center; font-size:{k.font_size.instructions}px; position:relative; display:flex; align-items:center; justify-content:center;'>
				{no_actions}
			</p>
		</div>
	{:else }
		<div class='actions'
			style='
				width: 100%;
				user-select: none;
				position:relative;
				top:{actions_top}px;
				z-index:{T_Layer.action};
				padding-bottom:{bottom_padding}px;'>
			{#if $w_s_alteration}
				<div class='alteration-instructions'
					style='
						width: 100%;
						display:block;
						user-select:none;
						position:relative;
						text-align:center;
						z-index:{T_Layer.action};
						font-size:{k.font_size.instructions}px;'>
					<div style='top:9px; width: 100%; position:relative;'>
						To <em>{$w_s_alteration.t_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
						<br> to <strong>{$w_ancestry_forDetails.title}</strong>
						<br> choose that item's <em>blinking</em> dot
					</div>
					<Button
						center={new Point(k.width.details / 2, 22)}
						font_size={k.font_size.instructions}
						handle_s_mouse={handle_cancel}
						zindex={T_Layer.frontmost}
						name='cancel-alteration'
						height={k.height.button}
						color = colors.default
						s_button={s_cancel}
						position='relative'
						width={40}>
						cancel
					</Button>
				</div>
			{:else}
				<Buttons_Table name='first'
					top={1}
					gap={2}
					width={table_width}
					has_title={has_title}
					title_gap={title_gap}
					font_sizes={font_sizes}
					t_target={T_Hit_Target.action}
					closure={handle_actionRequest}
					button_height={k.height.button}
					button_titles={button_titles[0]}
					mouse_detection={T_Mouse_Detection.autorepeat}/>
				<Separator name='after-upper-titles-column'
					isHorizontal={false}
					has_thin_divider={true}
					length={top_tableHeight}
					margin={k.details_margin}
					origin={new Point(left_afterTitle, -3)}
					thickness={k.thickness.separator.details}/>
				<Buttons_Table name='second'
					gap={2}
					top={17}
					row_offset={4}
					width={table_width}
					has_title={has_title}
					title_gap={title_gap}
					font_sizes={font_sizes}
					t_target={T_Hit_Target.action}
					closure={handle_actionRequest}
					button_height={k.height.button}
					button_titles={button_titles[1]}
					mouse_detection={T_Mouse_Detection.autorepeat}/>
				<Separator name='after-lower-titles-column'
					isHorizontal={false}
					has_thin_divider={true}
					margin={k.details_margin}
					length={bottom_tableHeight}
					thickness={k.thickness.separator.details}
					origin={new Point(left_afterTitle, top_tableHeight - 10)}/>
				<Separator name='bottom-of-actions'
					isHorizontal={true}
					has_thin_divider={true}
					margin={k.details_margin}
					title='edit your hierarchy'
					length={k.width.details - 1}
					title_left={k.separator_title_left}
					thickness={k.thickness.separator.details}
					origin={new Point(0.5, top_tableHeight - 10)}/>
			{/if}
		</div>
	{/if}
{/key}

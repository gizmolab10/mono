<script lang='ts'>
	import { c, g, k, p, core, u, x, hits, show, colors, details, elements } from '../../ts/common/Global_Imports';
	import { T_Thing, T_Layer, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { Point, Thing, Ancestry } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import type { Integer } from '../../ts/types/Types';
	import Text_Table from '../text/Text_Table.svelte';
	import Separator from '../draw/Separator.svelte';
	import Portal from '../draw/Portal.svelte';
	import Color from '../mouse/Color.svelte';
	import { onMount, tick } from 'svelte';
	export let top = 6;
	const id = 'selection details';
	const { w_t_details } = show;
	const { w_items: w_grabbed } = x.si_grabs;
	const s_info = elements.s_element_for(new Identifiable(id), T_Hit_Target.details, id);
	const { w_thing_title, w_ancestry_focus, w_ancestry_forDetails, w_relationship_order } = x;
	let ancestry: Ancestry | null = $w_ancestry_forDetails;
	let thing: Thing | null = ancestry?.thing ?? null;
	let thingHID: Integer | null = thing?.hid;
	let characteristics: Array<Object> = [];
	let relationships: Array<Object> = [];
	let color_origin: Point | null = null;
	let color = colors.default_forThings;
	let properties: Array<Object> = [];
	let characteristics_table: any;
	let thing_title = thing?.title;
	let picker_offset = k.empty;
	let trigger = k.empty;

	$: $w_t_details, layout_forColor();
	async function handle_toggle_properties(event: Event) {
		details.show_properties = !details.show_properties;
		await tick();
		hits.recalibrate();
	}

	$: {
		update_forAncestry();
		trigger = `${u.descriptionBy_title($w_grabbed)}:::${$w_ancestry_focus?.title}:::${$w_thing_title}:::>${u.descriptionBy_title($w_grabbed)}:::${$w_ancestry_forDetails?.title}:::<${$w_relationship_order}`;
	}

	onMount(() => {
		update_forAncestry();
		s_info.set_forHovering(colors.default, 'pointer');
	});

	function layout_forColor() {
		if (!!thing && !!characteristics_table && typeof characteristics_table.absolute_location_ofCellAt === 'function') {
			const row = Math.max(0, characteristics.findIndex(([key]) => key === 'color'));
			const offset_toRow = characteristics_table.absolute_location_ofCellAt(row, 1);
			color_origin = offset_toRow.offsetByXY(-6.5, -6.8);
			picker_offset = `-54px`;
		}
	}

	function handle_colors(result: string) {
		thing.color = color = result;
		thing.signal_color_change();
		(async () => {
			await thing.persist();
		})();
	}

	function update_forAncestry() {
		ancestry = $w_ancestry_forDetails;
		thing = ancestry?.thing;
		if (!!thing) {
			thing_title = thing.title;
			thingHID = thing.hid;
			color = thing.color;
			characteristics = [
				['modified', thing.persistence.lastModifyDate.toLocaleString()],
				['color',	 ancestry.isEditable ? k.empty : 'not editable'],
				['children', ancestry.children.length.supressZero()],
				['parents',  thing.parents.length.supressZero()],
				['relateds', thing.relatedRelationships.length.supressZero()],
				['progeny',	 ancestry.progeny_count().supressZero()],
			];
			properties = [
				['id',		 thing.id.beginWithEllipsis_forLength(15)],
				['ancestry', ancestry.id.beginWithEllipsis_forLength(15)],
				['kind',	 ancestry.predicate.kind],
				['type',	 Object.keys(T_Thing).find(k => T_Thing[k] === thing.t_thing)],
			];
			relationships = [
				['tags',	 x.si_thing_tags.length.supressZero()],
				['traits',	 x.si_thing_traits.length.supressZero()],
				['depth',	 ancestry.depth.supressZero()],
				['order',	 ancestry.order.supressNegative()],
			];
			layout_forColor();
		}
	}

</script>

{#key trigger}
	{#if !ancestry || !thing}
		<div>
			<p style='text-align:center; font-size:{k.font_size.instructions}px; position:relative; display:flex; align-items:center; justify-content:center;'>
				{k.nothing_to_show}
			</p>
		</div>
	{:else}
		<div class='selection-container' 
			style='
				left:8px;
				width:100%;
				color:black;
				top:{top}px;
				height:auto;
				position:relative;
				padding-bottom:25px;
				z-index:{T_Layer.frontmost};'>
			<Text_Table
				top={0}
				row_height={11}
				array={characteristics}
				name='characteristics-table'
				font_size={k.font_size.info}
				bind:this={characteristics_table}/>
			<Text_Table
				top={29}
				left={100}
				row_height={11}
				position='absolute'
				array={relationships}
				name='relationships-table'
				font_size={k.font_size.info}/>
			{#if !!color_origin && !!ancestry && ancestry.isEditable}
				<Portal className='selection-color-portal'>
					<Color
						color={color}
						origin={color_origin}
						color_closure={handle_colors}
						picker_offset={picker_offset}/>
				</Portal>
			{/if}
			{#if details.show_properties}
				<Text_Table
					top={12}
					row_height={11}
					array={properties}
					name='properties-table'
					font_size={k.font_size.info}/>
			{/if}
		</div>
		<Separator name='toggle-properties'
			isHorizontal={true}
			has_fillets={true}
			has_double_fillet={true}
			has_thin_divider={false}
			origin={new Point(1, 125)}
			zindex={T_Layer.frontmost + 1}
			length={k.width.details - 2.5}
			handle_mouseUp={handle_toggle_properties}
			thickness={k.thickness.separator.details}
			title='click to {details.show_properties ? 'hide' : 'show more'}'/>
	{/if}
{/key}

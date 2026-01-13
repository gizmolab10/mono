<script lang='ts'>
	import { h, k, x, Size, colors, details, elements, databases, show } from '../../ts/common/Global_Imports';
	import { T_Detail, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { T_Database } from '../../ts/database/DB_Common';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Text_Editor from '../text/Text_Editor.svelte';
	const { w_item: w_trait } = x.si_thing_traits;
	const s_button = elements.s_element_for(new Identifiable('trait'), T_Hit_Target.trait, 'trait');
	let text_box_size = new Size(k.width.details - 34, 68);
	s_button.set_forHovering(colors.default, 'pointer');
	x.update_grabs_forSearch();

	const { w_t_database } = databases;
	$: isFilesystemDB = $w_t_database === T_Database.filesystem;

	async function handle_click(event: MouseEvent) {
		if (!!$w_trait) {
			if (isFilesystemDB) {
				const thing = $w_trait.owner;
				if (thing) {
					show.show_previewOf_file(thing.id);
				}
			} else {
				window.open($w_trait.text, '_blank');
			}
		}
	}

</script>

{#if !$w_trait}
	<div class='no-traits'
		style='
			width: 100%;
			display: flex;
			position: relative;
			text-align: center;
			align-items: center;
			flex-direction: column;
			justify-content: center;
			-ms-overflow-style: none;
			height:{k.height.empty}px;
			font-size:{k.font_size.details}px;'>
			no traits
		</div>
{:else}
	<div class='trait-editor' style='padding: 6px'>
		<Text_Editor
			top={5}
			height={78}
			color={colors.default}
			label={$w_trait.t_trait}
			width={k.width.details - 20}
			original_text={$w_trait.text}
			label_underline={$w_trait.t_trait == 'link'}
			label_color={$w_trait.t_trait == 'link' ? 'blue' : 'black'}
			handleClick_onLabel={$w_trait.t_trait == 'link' ? handle_click : null}
			handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, $w_trait)}/>
	</div>
{/if}

<script lang='ts'>
	import { T_Detail }       from '../../common/Enumerations';
	import Banner_Hideable    from './Banner_Hideable.svelte';
	import D_Header           from './D_Header.svelte';
	import D_Actions          from './D_Actions.svelte';
	import D_Selection        from './D_Selection.svelte';
	import D_Preferences      from './D_Preferences.svelte';
</script>

<div class='details-stack'>
	<Banner_Hideable t_detail={T_Detail.header}>
		<D_Header />
	</Banner_Hideable>

	<Banner_Hideable t_detail={T_Detail.actions}>
		<D_Actions />
	</Banner_Hideable>

	<Banner_Hideable t_detail={T_Detail.selection}>
		<D_Selection />
	</Banner_Hideable>

	<Banner_Hideable t_detail={T_Detail.preferences}>
		<D_Preferences />
	</Banner_Hideable>
</div>

<style>
	.details-stack {
		display        : flex;
		flex-direction : column;
		height         : 100%;
		overflow-y     : auto;
		overflow-x     : hidden;
		scrollbar-width: none;
	}

	.details-stack::-webkit-scrollbar {
		display : none;
	}
</style>

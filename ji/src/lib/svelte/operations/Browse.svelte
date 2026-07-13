<script lang='ts'>
	// The browse view: every file in the active store, shown as name + type. Kept
	// live off the store-changed tick, so a drop or a delete updates it at once.
	// A search filter comes later; for now it shows all.
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/database/Signal';

	// A pure derived value: recomputed whenever the store-changed tick moves, with
	// no write-back, so it can't retrigger itself the way an effect+assign would.
	const rows = $derived.by(() => {
		$w_db_changed;                                   // re-read on every store change
		return databases.active.documents.map((d) => ({ name: d.name, kind: d.kind }));
	});
</script>

<div class='browse'>
	{#if rows.length === 0}
		<div class='empty'>no documents yet</div>
	{:else}
		<table class='files'>
			<tbody>
				{#each rows as row}
					<tr class='file'>
						<td class='kind'>{row.kind}</td>
						<td class='name'>{row.name}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.browse {
		padding    : var(--pad-view);
		box-sizing : border-box;
		height     : 100%;
		width      : 100%;
		overflow-y : auto;
	}

	.empty {
		opacity         : var(--opacity-label);
		font-size       : var(--font-base);
		color           : var(--text);
		align-items     : center;
		justify-content : center;
		display         : flex;
		height          : 100%;
	}

	.files {
		border-collapse : collapse;
		width           : 100%;
	}

	.name, .kind {
		padding        : var(--gap-tight) 0;
		font-size      : var(--font-base);
		color          : var(--text);
		vertical-align : baseline;
		text-align     : left;
	}

	.kind {
		opacity : var(--opacity-label);
		width   : 30px;
	}
</style>

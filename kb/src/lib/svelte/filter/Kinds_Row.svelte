<script lang='ts'>
	import { customizations } from '../../ts/common/Customizations';
	import { hit_target } from '../../ts/common/Core';

	// The kinds row of the label form: every kind on the host's closed list, the one the guide
	// wears picked. A guide wears one kind, so pressing the one it wears takes it off and pressing
	// any other puts that one on in its place. The form keeps the kind and writes it; this only
	// draws the row and says which was pressed.
	let { kind, onpick }: {
		kind   : string;                    // the kind the guide wears, or none
		onpick : (kind: string) => void;    // what the guide wears now: the one pressed, or none when the worn one was pressed
	} = $props();
</script>

<!-- The kinds. No word beside them: the separator above already says what they are. -->
<div class='label-rows kinds'>
	<div class='filter-row wrapping'>
		{#each customizations.kinds as one (one)}
			<button class='filter-pick' class:on={kind === one}
				use:hit_target={{ id: `editor.kind.${one}`,
					tip: `${kind === one ? 'remove' : 'add'} "${one}" kind`,
					onpress: () => onpick(kind === one ? '' : one) }}>{one}</button>
		{/each}
	</div>
</div>

<style>
	/* A row of the form. One gap below what it shows; its bare space answers nothing. The kinds
	   sit a tiny gap lower than the other label rows, a tiny gap each side, the row no taller. */
	.label-rows.kinds {
		padding-top    : var(--gap-tiny);
		padding-bottom : var(--gap-tiny);
		flex-direction : column;
		display        : flex;
		gap            : 0;
	}

	/* The rows keep their own height whatever the box is told to be, and nothing is clipped. */
	.filter-row.wrapping {
		transition      : height var(--slide-rows) linear;
		justify-content : center;
		align-content   : flex-start;
		align-items     : center;
		flex-wrap       : wrap;
		display         : flex;
		gap             : var(--gap);
	}

	.filter-pick {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.filter-pick:not(.on):global([data-hit]) {
		background : var(--hover);
	}

	/* Picked, it wears the accent, and its words read the color that stays legible on it — white
	   on a dark accent, black on a light one — the same as every other picked thing. */
	.filter-pick.on {
		background : var(--accent);
		color      : var(--text-on-accent);
	}
</style>

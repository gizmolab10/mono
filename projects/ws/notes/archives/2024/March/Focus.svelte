<script lang="ts">
	import { g, k, Point } from '../../ts/common/GlobalImports';
	import { s_thing_fontFamily } from '../../ts/common/State';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import Circle from '../kit/Circle.svelte';
	interface Props {
		center?: any;
		path?: string;
		thing: any; // needs:
	}

	let { center = new Point(), path = '', thing }: Props = $props();

	
	//  hover
	//  title
</script>

<Circle radius={k.circle_focus_radius} center={center} color={g.here.color} thickness=1/>
<TitleEditor thing={thing} path={path} fontSize={k.thing_fontSize}px fontFamily={$s_thing_fontFamily}/>

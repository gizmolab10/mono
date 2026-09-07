<script lang='ts'>
	import { k } from '../../ts/common/Global_Imports';
    export let fill = $w_background_color;
	export let invert = false;
	export let color = black;
	const viewBox = `0 -0.5 ${k.height.button} ${k.height.button}`;
	const bottom = 12.5;
	const right = 5.6;
	const left = 10.4;
	let top = 6;

	$: top = invert ? 7 : 6;

</script>

<style lang='scss'>
	.trash-container {
		position: relative;
		cursor: pointer;
		height: 16px;
		width: 16px;
		svg {
			position: absolute;
			left: 0;
			top: 0;
		}
	}
</style>

<div class='trash-container'>
	<svg class='trash-svg' width={k.height.button} height={k.height.button} fill={invert ? color : fill} stroke={color} viewBox={viewBox}>
		<path class='trash-path' d='M 14.5 3 C 14.5 3.552 14.052 4 13.5 4 L 13 4 L 13 13 C 13 14.105 12.105 15 11 15 L 5 15 C 3.895 15 3 14.105 3 13 L 3 4 L 2.5 4 C 1.948 4 1.5 3.552 1.5 3 L 1.5 2 C 1.5 1.448 1.948 1 2.5 1 L 6 1 C 6 0.448 6.448 0 7 0 L 9 0 C 9.552 0 10 0.448 10 1 L 13.5 1 C 14.052 1 14.5 1.448 14.5 2 L 14.5 3 Z' transform='matrix(1, 0, 0, 1, 0, 4.440892098500626e-16)'/>
	</svg>
	<svg class='trash-lines-svg' width={k.height.button} height={k.height.button} fill={invert ? fill : color} stroke={invert ? fill : color} viewBox={viewBox}>
		<line x1={invert ? 0 : 3} y1=4 x2={invert ? 15 : 13} y2=4/>
		<line x1={right} y1={top} x2={right} y2={bottom}/>
		<line x1={left} y1={top} x2={left} y2={bottom}/>
		<line x1=8 y1={top} x2=8 y2={bottom}/>
	</svg>
</div>

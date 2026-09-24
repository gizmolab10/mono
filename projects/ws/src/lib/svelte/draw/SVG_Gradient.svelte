<script lang='ts'>
	import { Size } from '../../ts/common/Global_Imports';
	export let name = 'shading' + Math.random().toString(36).substr(2, 9);
	export let path = 'M 50,50 C 50,50 50,50 50,50';
	export let size = Size.square(100);
	export let color = '#4a90e2';
	export let isInverted = true;
	const fill = 'url(#' + name + ')';
	function opacity_for(flag: boolean): string { return flag ? '0' : '1'; }

</script>

<svg width={size.width} height={size.height} viewBox='0 -2 {size.width} {size.height}'>
	<defs>
		<radialGradient id={name} cx='50%' cy='50%' r='50%' fx='50%' fy='50%'>
			<stop offset='0%' stop-color={color} stop-opacity={opacity_for(isInverted)} />
			<stop offset='100%' stop-color={color} stop-opacity={opacity_for(!isInverted)} />
		</radialGradient>
	</defs>
	<path d={path} fill={fill}/>
</svg>
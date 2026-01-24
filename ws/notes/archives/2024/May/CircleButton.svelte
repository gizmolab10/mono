<script lang="ts">
	import { u, Point } from '../../ts/common/GlobalImports';
	import Mouse from '../kit/Mouse.svelte';
	interface Props {
		closure?: any;
		center?: any;
		borderColor?: string;
		textColor?: string;
		color?: string;
		size?: number;
		children?: import('svelte').Snippet;
	}

	let {
		closure = (mouseData) => {},
		center = Point.square(7),
		borderColor = '#333',
		textColor = '#400',
		color = '#ccc',
		size = 14,
		children
	}: Props = $props();
</script>

<Mouse
	width={size}
	height={size}
	center={center}
	closure={closure}
	name='circle-button'
	detect_mouseDown={false}
	detect_longClick={false}
	detect_doubleClick={false}
	style='
		display: flex;
		cursor: pointer;
		color: {textColor}
		font-weight: bold;
		border-radius: 50%;
		align-items: center;
		line-height: {size}px;
		justify-content: center;
		font-size: {size - 1}px;;
		background-color: {color};
		border: 1px solid {borderColor};
		transform: translate(-50%, -50%);
	'>
	{@render children?.()}
</Mouse>

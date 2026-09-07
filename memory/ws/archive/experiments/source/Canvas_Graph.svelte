<script lang='ts'>
	import { onMount } from 'svelte';
	import { w_ancestry_focus, w_user_graph_offset, w_graph_rect } from '../../ts/managers/Stores';
	import { layout, T_Layer } from '../../ts/common/Global_Imports';
	import { w_depth_limit } from '../../ts/managers/Stores';
	
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let reattachments = 0;
	
	// Get canvas context and set up rendering
	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			renderGraph();
		}
	});
	
	// Re-render when data changes
	$: {
		if (ctx && canvas) {
			reattachments++;
			renderGraph();
		}
	}
	
	function renderGraph() {
		if (!ctx || !canvas) return;
		
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
		// Apply scaling
		ctx.save();
		ctx.scale(layout.scale_factor, layout.scale_factor);
		
		// Apply translation
		ctx.translate($w_user_graph_offset.x, $w_user_graph_offset.y);
		
		// Render tree structure
		renderTree($w_ancestry_focus, 0);
		
		ctx.restore();
	}
	
	function renderTree(node: any, depth: number) {
		if (!node || depth > $w_depth_limit) return;
		
		const widget = node.g_widget;
		if (!widget) return;
		
		// Get the thing object which contains the title
		const thing = node.thing;
		if (!thing) return;
		
		// Render widget background
		ctx.fillStyle = widget.background_color || '#ffffff';
		ctx.fillRect(widget.rect.left, widget.rect.top, widget.rect.width, widget.rect.height);
		
		// Render widget border
		ctx.strokeStyle = widget.stroke_color || '#000000';
		ctx.lineWidth = 1;
		ctx.strokeRect(widget.rect.left, widget.rect.top, widget.rect.width, widget.rect.height);
		
		// Render text - get title from thing object
		ctx.fillStyle = widget.text_color || '#000000';
		ctx.font = `${widget.font_size || 12}px ${widget.font_family || 'Arial'}`;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		
		const textX = widget.rect.left + widget.rect.width / 2;
		const textY = widget.rect.top + widget.rect.height / 2;
		const title = thing.title || thing.id || '';
		ctx.fillText(title, textX, textY);
		
		// Render connections to children
		if (node.children) {
			node.children.forEach((child: any) => {
				renderConnection(widget, child.g_widget);
				renderTree(child, depth + 1);
			});
		}
	}
	
	function renderConnection(parentWidget: any, childWidget: any) {
		if (!parentWidget || !childWidget) return;
		
		ctx.strokeStyle = '#666666';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(parentWidget.rect.left + parentWidget.rect.width / 2, parentWidget.rect.bottom);
		ctx.lineTo(childWidget.rect.left + childWidget.rect.width / 2, childWidget.rect.top);
		ctx.stroke();
	}
	
	// Export canvas as image for printing
	function exportAsImage(): string {
		return canvas.toDataURL('image/png');
	}
</script>

<div class="canvas-graph-container" style="z-index: {T_Layer.common};">
	<canvas 
		bind:this={canvas}
		width={$w_graph_rect.size.width}
		height={$w_graph_rect.size.height}
		style="
			width: {$w_graph_rect.size.width}px;
			height: {$w_graph_rect.size.height}px;
			border: 1px solid #ccc;
		">
	</canvas>
</div> 
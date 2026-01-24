<script>
	import { Point, Rect, Size } from '../../ts/types/Coordinates';
	import { k } from '../../ts/common/Constants';
	export let element; // The HTML element (E) to print
	export let rect; // The rect (position and size of D)
	const screen_scale_factor = window.devicePixelRatio;``
	const message_height = 290;
	let printer_page_width = 722;
	let final_content_rect;
	let printer_dpi = 96;
	let final_inset_size;
	let final_page_size;
	let final_origin;
	let log_message;
	let isLandscape;
	let scaleFactor;
	let margin = 0;
	let scale_size;
	let printable;
	let kludge
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//
	//	Printing origin calculation:
	//
	//	pO		k - dC * dpF
	//	dC		dO + dS / 2
	//
	//	scalars:
	//
	//	dpF		scaleFactor
	//	m		margin
	//
	//	vectors:
	//
	// 	k		kludge								BROKEN, doesn't work for many variants of D
	//	pO		final_origin						top left for print style
	//	pS		final_inset_size
	//	dS		given_content_rect . size
	//	dC		given_content_rect . center
	//	dO		given_content_rect . origin			location of the drawn sub element within the given element
	//
	/////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	configure();
	layout();

	$: if (!!printable) {
		printable.innerHTML = k.empty;
		printable.appendChild(element.cloneNode(true));
	}

	function configure() {
		const printCSS = `
			@media print {
				.print-test {
						top: 0; 
						left: 0; 
						width: 100%; 
						height: 100%; 
						position: absolute; 
					}
				}`;
		const square_inch = document.createElement('div');
		const style = document.createElement('style');
		const page = document.createElement('div');
		style.textContent = printCSS;
		page.className = 'print-test';
		square_inch.style.cssText = 'width: 1in; height: 1in; position: absolute; top: -9999px;';

		document.head.appendChild(style);
		document.body.appendChild(page);
		printer_page_width = page.offsetWidth;
		document.body.removeChild(page);
		document.head.removeChild(style);

		document.body.appendChild(square_inch);
		printer_dpi = square_inch.offsetWidth;
		document.body.removeChild(square_inch);
		margin = printer_dpi * 0.75; // 3/4 inch margins
	}
	
	function debug_log() {
		return `Screen scale factor: ${screen_scale_factor}
Given content origin: ${rect.description}
Given content size: ${rect.size.description}
Kludge: ${kludge.description}
Final DPI: ${k.printer_dpi}
Final scale factor: ${scaleFactor.toFixed(4)}
Final margin: ${margin}
Final page size: ${final_page_size.description}
Final page center: ${final_page_size.center.description}
Final inset size: ${final_inset_size.description}
Final content size: ${final_content_rect.size.description}
Final content center: ${final_content_rect.center.description}
Final origin: ${final_origin.description}
`;
	}

	function layout() {
		const w = printer_page_width;
		const h = w * printer_aspect_ratio;
		isLandscape = rect.size.width > rect.size.height;
		final_page_size = new Size(
			isLandscape ? h : w,
			isLandscape ? w : h
		);
		margin = printer_dpi * 0.75; // 3/4 inch margins
		final_inset_size = final_page_size.insetEquallyBy(margin);
		scale_size = final_inset_size.dividedBy(rect.size);
		scaleFactor = Math.min(scale_size.width, scale_size.height) * screen_scale_factor;
		final_content_rect = rect.multipliedEquallyBy(scaleFactor);
		kludge = new Point(-220, -380);
		final_origin = final_page_size.center.offsetBy(rect.center.negated).offsetBy(kludge);
		log_message = debug_log();
	}
	
</script>

<div class='print-container'>
	{#if !!final_origin && !!scaleFactor}
		<div class='printable-content'
			bind:this={printable}
			style='
				transform: scale({scaleFactor});
				transform-origin: 50% 50%;
				left: {final_origin.x}px;
				top: {final_origin.y}px;
				position: absolute;
			'>
		</div>
	{/if}
	{#if !!log_message && !!final_page_size && !!final_inset_size}
		<div class='message-box'
			style='
				width: {final_inset_size.width * 1.5}px;
				top: {final_page_size.height - 100}px;
				font-size: {k.font_size.warning}px;
				background-color: transparent;
				height: {message_height}px;
				box-sizing: border-box;
				font-family: monospace;
				white-space: pre-wrap;
				border: 2px solid red;
				position: absolute;
				overflow: auto;
				padding: 8px;
				color: black;
				left: 0px;
			'>
			{log_message}
		</div>
	{/if}
</div>

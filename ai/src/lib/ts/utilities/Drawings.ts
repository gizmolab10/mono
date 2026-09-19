// A drawing, ai's since 18 September 2026: an svg file the memory system holds, listed beside the
// markdown files and shown in the renderer as the picture it is. Plain work on text, needing
// nothing on screen: whether a file name is a drawing's, and the svg's text made ready to fit
// the width of the view.

/** Whether a file name is a drawing's, an svg file. */
export function is_drawing(file_name: string): boolean {
	return /\.svg$/i.test(file_name);
}

/**
 * The svg's text with a viewBox on its opening tag, so the browser scales the picture to
 * whatever width the view gives it, shrinking or growing it as one piece. A viewBox already
 * there is kept; one is made from the width and height the tag names; a tag naming neither
 * is left alone, since nothing says the picture's shape.
 */
export function with_view_box(svg: string): string {
	const opening = /<svg\b[^>]*>/i.exec(svg);
	if (!opening || /\bviewBox\s*=/i.test(opening[0])) { return svg; }
	const width = /\bwidth\s*=\s*["']?\s*([\d.]+)/i.exec(opening[0]);
	const height = /\bheight\s*=\s*["']?\s*([\d.]+)/i.exec(opening[0]);
	if (!width || !height) { return svg; }
	const tag = opening[0].replace(/<svg\b/i, `<svg viewBox="0 0 ${width[1]} ${height[1]}"`);
	return svg.slice(0, opening.index) + tag + svg.slice(opening.index + opening[0].length);
}

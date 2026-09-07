export default class Cursors {
	svgPath = 'M16 0L20 10H12L16 0Z'; // .html_encode();
	svg_cursor_url = `data:image/svg+xml, <svg width='32' height='32' viewBox='0 0 32 32'><path stroke='red' d='${this.svgPath}'/></svg>`;
	svg_cursor = `url("${this.svg_cursor_url}") 16 16`;
}

export const cursors = new Cursors();

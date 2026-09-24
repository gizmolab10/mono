import { u } from '../common/Global_Imports';

export default class G_Repeater {
	title_widths: Array<number>;
	widths: Array<number> = [];
	lefts: Array<number> = [];
	proportionate: boolean;
	title_gap: number = 8;
	swap_title = false;
	font_size: number;
	columns: number;
    titles: string[];
	margin: number;
    height: number;
    width: number;
	padding = 8;
	gap = 0;

	//////////////////////////////////////////////////////////////
	//															//
	//	titles:			strings to display						//
	//	swap_title:		swap first and second titles			//
	//	proportionate:	space titles according to their widths	//
	//	font_size:		needed to compute each title's width	//
	//	gap:			between titles							//
	//	padding:		around titles							//
	//	margin:			on right and left						//
	//	title_gap:		after first title						//
	//															//
	//////////////////////////////////////////////////////////////

	constructor(titles: string[],
		height: number,
		width: number,
		margin: number,
		gap: number,
		padding: number,
		title_gap: number,
		proportionate: boolean,
		font_size: number,
		swap_title: boolean = false) {
		this.titles = G_Repeater.swap_titles(titles, swap_title);
		this.proportionate = proportionate;
		this.columns = titles.length;
		this.swap_title = swap_title;
		this.title_gap = title_gap;
		this.font_size = font_size;
		this.padding = padding;
		this.height = height;
		this.margin = margin;
		this.width = width;
		this.gap = gap;
		this.title_widths = this.titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
		this.widths = this.title_widths.map((w, i) => this.gap + this.button_width_for(i));
	}

	static swap_titles(titles: string[], swap_title: boolean): string[] {
		return (!swap_title || titles.length < 2) ? titles : [titles[1], titles[0], ...titles.slice(2)];
	}

	should_swap_titles(): boolean { return this.swap_title && this.titles.length > 1; }

	button_width_for(column: number): number { 
		const total_width = this.title_widths.reduce((acc, width) => acc + width, 0);	// sum of title widths
		if (this.proportionate) {
			const margin_and_gaps = this.margin * 2 + this.title_gap + this.gap * (this.columns - 1);
			const approportionment = (this.width - total_width - margin_and_gaps) / this.columns;
			return this.title_widths[column] + approportionment; 
		}
		if (column === (this.should_swap_titles() ? 1 : 0)) {
			const widths = this.title_widths.filter((_, i) => i !== column);
			const other_buttons_width = widths.reduce((acc, width) => acc + width + this.padding * 2, 0);
			return this.width - other_buttons_width - this.margin * 2 - this.gap - this.padding;
		}
		return this.title_widths[column] + this.padding * 2;
	}

	button_left_for(column: number): number {
		if (this.proportionate) {
			return this.widths.slice(0, column).reduce((sum, width) => sum + width, this.title_gap - this.gap / 2);
		}
		let x = 0;
		for (let i = 0; i < column; i++) {
			x += this.button_width_for(i) + this.gap;
		}
		return x;
	}
	
}
import Printable from '../../svelte/draw/Printable.svelte';
import { Rect } from '../types/Coordinates';
import { u } from './Utilities';
import printJS from 'print-js';

export default class Print {
	printable!: HTMLElement;
	
	print_element_byClassName_withRect(className: string, rect: Rect, title: string) {
		const element = document.querySelector(`.${className}`) as HTMLElement;
		this.print_element_withRect(element, rect, title);
	}
	
	async print_element_withRect(element: HTMLElement, rect: Rect, title: string) {
		if (!!element) {
			if (element.offsetWidth === 0 || element.offsetHeight === 0) {
				console.error('Element has zero dimensions, cannot print');
			} else {
				try {
					await new Promise(resolve => setTimeout(resolve, 100));
					u.temporarily_setDefaults_while(() => {
						const isLandscape = rect.size.width > rect.size.height;
						this.setup_printable(element, rect);
						this.print_printable(isLandscape, title);
					});
				} catch (error) {
					console.error('Error printing element:', error);
				}
			}
		}
	}
	
	private setup_printable(element: HTMLElement, rect: Rect) {
		this.printable = document.createElement('div');
		new Printable({
			target: this.printable,
			props: {
				element: element,
				rect: rect
			}
		});
	}
	
	private print_printable(isLandscape: boolean, title: string) {
		printJS({
			type: 'html',
			documentTitle: title,
			printable: this.printable,
			style: `
				@media print { 
					@page {
						size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
						orientation: ${isLandscape ? 'landscape' : 'portrait'};
					}
				}
			`,
			scanStyles: false
		});
	}
}

export const print = new Print();
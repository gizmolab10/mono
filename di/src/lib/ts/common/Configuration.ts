import { T_Browser } from '../types/Enumerations';
import MobileDetect from 'mobile-detect';
import { writable } from 'svelte/store';

export class Configuration {

	w_device_isMobile = writable<boolean>(false);

	get device_isMobile(): boolean {
		const md = new MobileDetect(window.navigator.userAgent);
		return !!md.mobile();
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
	}

	get siteTitle(): string {
		const host = this.isServerLocal ? 'local' : 'remote';
		return `Design Intuition ${host}`;
	}

	get browserType(): T_Browser {
		const userAgent: string = navigator.userAgent;
		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):  return T_Browser.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent): return T_Browser.chrome;
			case /firefox\/(\d+)/i.test(userAgent):		   return T_Browser.firefox;
			case /opr\/(\d+)/i.test(userAgent):			   return T_Browser.opera;
			case /orion\/(\d+)/i.test(userAgent):		   return T_Browser.orion;
			case /safari\/(\d+)/i.test(userAgent):		   return T_Browser.safari;
			default:									   return T_Browser.unknown
		}
	}

}

export const c = new Configuration();

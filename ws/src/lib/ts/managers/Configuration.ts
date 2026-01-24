import { e, g, k, p, show, debug, search, colors, radial } from '../common/Global_Imports';
import { T_Browser, features, databases } from '../common/Global_Imports';
import { DB_Name } from '../database/DB_Common';
import MobileDetect from 'mobile-detect';
import { writable } from 'svelte/store';

export class Configuration {

	queryStrings = new URLSearchParams(window.location.search);
	w_device_isMobile = writable<boolean>(false);
	erasePreferences = 0;
	eraseDB = 0;

	configure() {
		
		//////////////////////////////////////
		//									//
		//	 first code called by the app	//
		//									//
		//////////////////////////////////////

		// DO NOT CHANGE THE ORDER OF THESE CALLS

		const q = this.queryStrings;
		debug.apply_queryStrings(q);
		colors.restore_preferences();
		search.setup_defaults();
		this.apply_queryStrings(q);						// must call BEFORE prefs and db
		features.apply_queryStrings(q);
		g.restore_preferences();
		databases.apply_queryStrings(q);
		show.restore_preferences();						// must call BEFORE prefs
		radial.restore_radial_preferences();
		p.restore_preferences();
		show.apply_queryStrings(q);
		e.setup();
	}

	apply_queryStrings(queryStrings: URLSearchParams) {
        const eraseOptions	 = queryStrings.get('erase')?.split(k.comma) ?? [];
		for (const eraseOption of eraseOptions) {
			switch (eraseOption) {
				case 'data':	 this.eraseDB = 4;		break;
				case 'settings': p.preferences_reset(); break;
			}
		}
    }

	get device_isMobile(): boolean {
		const md = new MobileDetect(window.navigator.userAgent);
		return !!md.mobile();
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
	}

	get siteTitle(): string {
		const idBase = databases.db_now.idBase;
		const t_database = databases.db_now.t_database;
		const host = this.isServerLocal ? 'local' : 'remote';
		const base_name = idBase ? (idBase + ', ') : DB_Name.unknown;
		const db_name = t_database ? (t_database + ', ') : DB_Name.unknown;
		return `Seriously (${host}, ${db_name}${base_name}${this.browserType}, α)`;
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

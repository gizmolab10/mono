import { g } from '../../ts/state/Global_State';

export enum ReactKind {
	build	= 'build',
	mount	= 'mount',
	layout	= 'layout',
	action  = 'action',
	origins = 'origins',
	rebuild = 'rebuild',
}

export class DebugReact {
	kinds: Array<ReactKind>;

	constructor(kinds: Array<ReactKind>) { this.kinds = kinds; }
	hasKind(kind: ReactKind) { return this.kinds.includes(kind); }
	log_build(message: string) { this.log_maybe(ReactKind.build, message) }
	log_mount(message: string) { this.log_maybe(ReactKind.mount, message) }
	log_action(message: string) { this.log_maybe(ReactKind.action, message) }
	log_layout(message: string) { this.log_maybe(ReactKind.layout, message) }
	log_origins(message: string) { this.log_maybe(ReactKind.origins, message) }
	log_rebuild(message: string) { this.log_maybe(ReactKind.rebuild, message) }
	log_maybe(kind: ReactKind, message: string) { if (this.hasKind(kind)) { console.log(`${kind.toUpperCase()}  ${message}`); }}

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const debug = queryStrings.get('react');
		if (debug) {
			const kinds = debug.split(',');
			for (const kind of kinds) {
				switch (kind) {
					case 'build': this.kinds.push(ReactKind.build); break;
					case 'mount': this.kinds.push(ReactKind.mount); break;
					case 'action': this.kinds.push(ReactKind.action); break;
					case 'layout': this.kinds.push(ReactKind.layout); break;
					case 'origins': this.kinds.push(ReactKind.origins); break;
					case 'rebuild': this.kinds.push(ReactKind.rebuild); break;
				}
			}
		}
	}
}

export const debugReact = new DebugReact([]);

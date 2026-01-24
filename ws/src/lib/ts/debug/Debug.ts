import { c } from '../managers/Configuration';

// query string: ?debug=p,action

export enum T_Debug {
	bidirectionals	= 'bidirectionals',
	preferences		= 'preferences',
	hide_rings		= 'hide_rings',
	component		= 'component',		// S_Component
	fast_load		= 'fast_load',
	segments		= 'segments',
	actions			= 'actions',		// state logic of actions
	reticle			= 'reticle',		// show center of radial layout geometry
	action  		= 'action',
	bubble  		= 'bubble',
	colors			= 'colors',
	cursor			= 'cursor',
	crumbs  		= 'crumbs',
	expand  		= 'expand',
	handle			= 'handle',
	layout 			= 'layout',			// branches and widgets
	radial			= 'radial',
	remote			= 'remote',			// interactions with remote (databases)
	signal			= 'signal',
	things			= 'things',			// properties of things
	build			= 'build',			// completely reattach graph and its entire DOM
	error			= 'error',			// async errors
	focus			= 'focus',			// watch for and log focus changes
	graph			= 'graph',			// size of graph area
	lines			= 'lines',			// alignment dots for lines and widgets
	mouse			= 'mouse',
	order			= 'order',
	style			= 'style',
	trace			= 'trace',
	draw			= 'draw',
	edit			= 'edit',			// state machine for editing
	grab			= 'grab',
	hits			= 'hits',
	move			= 'move',
	key				= 'key',			// keyboard input
}

export class Debug {
	flags: Array<T_Debug>;
	constructor(flags: Array<T_Debug>) { this.flags = flags; }
	hasOption(option: T_Debug) { return this.flags.includes(option); }
	captureStackTrace(): string | undefined { return new Error().stack; }

	get graph(): boolean { return this.hasOption(T_Debug.graph); }
	get focus(): boolean { return this.hasOption(T_Debug.focus); }
	get lines(): boolean { return this.hasOption(T_Debug.lines); }
	get trace(): boolean { return this.hasOption(T_Debug.trace); }
	get cursor(): boolean { return this.hasOption(T_Debug.cursor); }
	get radial(): boolean { return this.hasOption(T_Debug.radial); }
	get crumbs(): boolean { return this.hasOption(T_Debug.crumbs); }
	get reticle(): boolean { return this.hasOption(T_Debug.reticle); }
	get actions(): boolean { return this.hasOption(T_Debug.actions); }
	get fast_load(): boolean { return this.hasOption(T_Debug.fast_load); }
	get component(): boolean { return this.hasOption(T_Debug.component); }
	get hide_rings(): boolean { return this.hasOption(T_Debug.hide_rings); }

	log_alert(option: T_Debug, message: string) { alert(message); }
	log_key(message: string, ...args: any[]) { this.log_maybe(T_Debug.key, message, ...args); }
	log_draw(message: string, ...args: any[]) { this.log_maybe(T_Debug.draw, message, ...args); }
	log_edit(message: string, ...args: any[]) { this.log_maybe(T_Debug.edit, message, ...args); }
	log_grab(message: string, ...args: any[]) { this.log_maybe(T_Debug.grab, message, ...args); }
	log_hits(message: string, ...args: any[]) { this.log_maybe(T_Debug.hits, message, ...args); }
	log_move(message: string, ...args: any[]) { this.log_maybe(T_Debug.move, message, ...args); }
	log_build(message: string, ...args: any[]) { this.log_maybe(T_Debug.build, message, ...args); }
	log_error(message: string, ...args: any[]) { this.log_maybe(T_Debug.error, message, ...args); }
	log_lines(message: string, ...args: any[]) { this.log_maybe(T_Debug.lines, message, ...args); }
	log_mouse(message: string, ...args: any[]) { this.log_maybe(T_Debug.mouse, message, ...args); }
	log_style(message: string, ...args: any[]) { this.log_maybe(T_Debug.style, message, ...args	); }
	log_action(message: string, ...args: any[]) { this.log_maybe(T_Debug.action, message, ...args); }
	log_bubble(message: string, ...args: any[]) { this.log_maybe(T_Debug.bubble, message, ...args); }
	log_colors(message: string, ...args: any[]) { this.log_maybe(T_Debug.colors, message, ...args); }
	log_crumbs(message: string, ...args: any[]) { this.log_maybe(T_Debug.crumbs, message, ...args); }
	log_cursor(message: string, ...args: any[]) { this.log_maybe(T_Debug.cursor, message, ...args); }
	log_expand(message: string, ...args: any[]) { this.log_maybe(T_Debug.expand, message, ...args); }
	log_handle(message: string, ...args: any[]) { this.log_maybe(T_Debug.handle, message, ...args); }
	log_layout(message: string, ...args: any[]) { this.log_maybe(T_Debug.layout, message, ...args); }
	log_radial(message: string, ...args: any[]) { this.log_maybe(T_Debug.radial, message, ...args); }
	log_remote(message: string, ...args: any[]) { this.log_maybe(T_Debug.remote, message, ...args); }
	log_signal(message: string, ...args: any[]) { this.log_maybe(T_Debug.signal, message, ...args); }
	log_actions(message: string, ...args: any[]) { this.log_maybe(T_Debug.actions, message, ...args); }
	log_segments(message: string, ...args: any[]) { this.log_maybe(T_Debug.segments, message, ...args); }
	log_component(message: string, ...args: any[]) { this.log_maybe(T_Debug.component, message, ...args); }
	log_preferences(message: string, ...args: any[]) { this.log_maybe(T_Debug.preferences, message, ...args); }
	log_bidirectionals(message: string, ...args: any[]) { this.log_maybe(T_Debug.bidirectionals, message, ...args); }
	
	log_maybe(option: T_Debug, message: string, ...args: any[]) {
		if (this.hasOption(option)) {
			let log = [message, ...args].join(' ');
			if (this.trace) {
				log = `\n${log}\n${this.captureStackTrace()}`;
			}
			console.log(option.toUpperCase(), log);
		}
	}

	apply_queryStrings(queryStrings: URLSearchParams) {
		const query = queryStrings.get('debug');
		if (query) {
			const flags = query.split(',');
			for (const option of flags) {
				switch (option) {
					case 'bidirectionals': this.flags.push(T_Debug.bidirectionals); break;
					case 'preferences': this.flags.push(T_Debug.preferences); break;
					case 'component': this.flags.push(T_Debug.component); break;
					case 'hide_rings': this.flags.push(T_Debug.hide_rings); break;
					case 'fast_load': this.flags.push(T_Debug.fast_load); break;
					case 'segments': this.flags.push(T_Debug.segments); break;
					case 'actions': this.flags.push(T_Debug.actions); break;
					case 'reticle': this.flags.push(T_Debug.reticle); break;
					case 'action': this.flags.push(T_Debug.action); break;
					case 'bubble': this.flags.push(T_Debug.bubble); break;
					case 'colors': this.flags.push(T_Debug.colors); break;
					case 'crumbs': this.flags.push(T_Debug.crumbs); break;
					case 'cursor': this.flags.push(T_Debug.cursor); break;
					case 'expand': this.flags.push(T_Debug.expand); break;
					case 'handle': this.flags.push(T_Debug.handle); break;
					case 'layout': this.flags.push(T_Debug.layout); break;
					case 'radial': this.flags.push(T_Debug.radial); break;
					case 'remote': this.flags.push(T_Debug.remote); break;
					case 'signal': this.flags.push(T_Debug.signal); break;
					case 'things': this.flags.push(T_Debug.things); break;
					case 'build': this.flags.push(T_Debug.build); break;
					case 'error': this.flags.push(T_Debug.error); break;
					case 'focus': this.flags.push(T_Debug.focus); break;
					case 'graph': this.flags.push(T_Debug.graph); break;
					case 'lines': this.flags.push(T_Debug.lines); break;
					case 'mouse': this.flags.push(T_Debug.mouse); break;
					case 'order': this.flags.push(T_Debug.order); break;
					case 'trace': this.flags.push(T_Debug.trace); break;
					case 'style': this.flags.push(T_Debug.style); break;
					case 'draw': this.flags.push(T_Debug.draw); break;
					case 'edit': this.flags.push(T_Debug.edit); break;
					case 'grab': this.flags.push(T_Debug.grab); break;
					case 'hits': this.flags.push(T_Debug.hits); break;
					case 'move': this.flags.push(T_Debug.move); break;
					case 'key': this.flags.push(T_Debug.key); break;
				}
			}
		}
	}
}

export const debug   = new Debug([]);

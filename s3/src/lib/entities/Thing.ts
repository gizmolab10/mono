import { Identifiable } from './Identifiable';
import { T_Thing }       from '../common/Enumerations';

export class Thing extends Identifiable {
	idBase:  string;
	title:   string;
	color:   string;
	t_thing: T_Thing;

	constructor(
		idBase:            string,
		id:                string,
		title:             string   = 'Please, enter a title',
		color:             string   = '#b4b4b4',
		t_thing:           T_Thing  = T_Thing.generic,
		already_persisted: boolean  = false,
	) {
		super(id);
		this.idBase  = idBase;
		this.title   = title;
		this.color   = color;
		this.t_thing = t_thing;
	}

	get isRoot()     { return this.t_thing === T_Thing.root; }
	get isFolder()   { return this.t_thing === T_Thing.folder; }
	get isBookmark() { return this.t_thing === T_Thing.bookmark; }
	get isBulkAlias(){ return this.t_thing === T_Thing.bulk; }
	get description(){ return `${this.id} "${this.title}"`; }
}

import { Identifiable } from './Identifiable';
import type { Integer } from '../types/Types';

export class Relationship extends Identifiable {
	idBase:     string;
	kind:       string;
	idParent:   string;
	idChild:    string;
	orders:     number[];
	hidParent:  Integer;
	hidChild:   Integer;
	isReversed: boolean;

	constructor(
		idBase:            string,
		id:                string,
		kind:              string,
		idParent:          string,
		idChild:           string,
		orders:            number[],
		already_persisted: boolean = false,
	) {
		super(id);
		this.idBase     = idBase;
		this.kind       = kind;
		this.idParent   = idParent;
		this.idChild    = idChild;
		this.orders     = orders;
		this.hidParent  = idParent.hash();
		this.hidChild   = idChild.hash();
		this.isReversed = false;
	}
}

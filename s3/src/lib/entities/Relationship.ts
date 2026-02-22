import { Persistable }                   from './Persistable';
import { T_Persistence, T_Persistable } from '../common/Enumerations';
import type { Integer }                  from '../types/Types';

export class Relationship extends Persistable {
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
		already_persisted: boolean        = false,
		t_persistence:     T_Persistence  = T_Persistence.none,
	) {
		super(idBase, idBase, T_Persistable.relationships, id, already_persisted, t_persistence);
		this.kind       = kind;
		this.idParent   = idParent;
		this.idChild    = idChild;
		this.orders     = orders;
		this.hidParent  = idParent.hash();
		this.hidChild   = idChild.hash();
		this.isReversed = false;
	}
}

import { Persistable }                   from './Persistable';
import { T_Persistence, T_Persistable } from '../common/Enumerations';
import type { Integer }                  from '../types/Types';

export class Tag extends Persistable {
	type:      string;
	thingHIDs: Integer[];

	constructor(
		idBase:            string,
		id:                string,
		type:              string,
		thingHIDs:         Integer[],
		already_persisted: boolean        = false,
		t_persistence:     T_Persistence  = T_Persistence.none,
	) {
		super(idBase, idBase, T_Persistable.tags, id, already_persisted, t_persistence);
		this.type      = type;
		this.thingHIDs = thingHIDs;
	}
}

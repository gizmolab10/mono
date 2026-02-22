import { Persistable }    from './Persistable';
import { T_Persistable } from '../common/Enumerations';
import type { Integer }   from '../types/Types';

export class Tag extends Persistable {
	type:      string;
	thingHIDs: Integer[];

	constructor(
		idBase:            string,
		id:                string,
		type:              string,
		thingHIDs:         Integer[],
		already_persisted: boolean = false,
	) {
		super(idBase, idBase, T_Persistable.tags, id, already_persisted);
		this.type      = type;
		this.thingHIDs = thingHIDs;
	}
}

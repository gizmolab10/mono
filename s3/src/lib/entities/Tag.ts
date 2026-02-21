import { Identifiable } from './Identifiable';
import type { Integer } from '../types/Types';

export class Tag extends Identifiable {
	idBase:    string;
	type:      string;
	thingHIDs: Integer[];

	constructor(
		idBase:            string,
		id:                string,
		type:              string,
		thingHIDs:         Integer[],
		already_persisted: boolean = false,
	) {
		super(id);
		this.idBase    = idBase;
		this.type      = type;
		this.thingHIDs = thingHIDs;
	}
}

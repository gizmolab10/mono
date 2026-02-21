import { Identifiable } from './Identifiable';
import { T_Trait }       from '../common/Enumerations';

export class Trait extends Identifiable {
	idBase:  string;
	ownerID: string;
	t_trait: T_Trait;
	text:    string;

	constructor(
		idBase:            string,
		id:                string,
		ownerID:           string,
		t_trait:           T_Trait,
		text:              string  = '',
		already_persisted: boolean = false,
	) {
		super(id);
		this.idBase  = idBase;
		this.ownerID = ownerID;
		this.t_trait = t_trait;
		this.text    = text;
	}
}

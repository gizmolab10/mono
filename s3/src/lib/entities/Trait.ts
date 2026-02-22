import { Persistable }              from './Persistable';
import { T_Trait, T_Persistable } from '../common/Enumerations';

export class Trait extends Persistable {
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
		super(idBase, idBase, T_Persistable.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.t_trait = t_trait;
		this.text    = text;
	}
}

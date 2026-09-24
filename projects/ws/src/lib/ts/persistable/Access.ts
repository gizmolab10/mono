import { Persistable, T_Persistable } from '../common/Global_Imports';

export default class Access extends Persistable {
	kind: string;

	constructor(t_database: string, t_persistable: T_Persistable, id: string, kind: string, already_persisted: boolean = false) {
		super(t_database, '', t_persistable, id, already_persisted);
		this.kind = kind;
	}

}
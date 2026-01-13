import { Persistable, T_Persistable } from '../common/Global_Imports';

export default class User extends Persistable {
	email: string;
	phone: string;
	name: string;

	constructor(t_database: string, t_persistable: T_Persistable, id: string, name: string, email: string, phone: string, already_persisted: boolean = false) {
		super(t_database, '', t_persistable, id, already_persisted);
		this.name = name;
		this.email = email;
		this.phone = phone;
	}

}
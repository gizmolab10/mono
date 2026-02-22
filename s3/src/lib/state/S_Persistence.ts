import type { Async_Handle_Boolean } from '../types/Types';
import { T_Persistable }             from '../common/Enumerations';

export class S_Persistence {
	awaiting_remoteCreation = false;
	t_persistable:   T_Persistable;
	lastModifyDate = new Date();
	already_persisted = false;
	needsBulkFetch = false;
	t_database:      string;
	isDirty =        false;
	id:              string;

	get isPersistent(): boolean { return false; }  // stub until Phase 6 wires up databases
	updateModifyDate() { this.lastModifyDate = new Date(); }

	constructor(
		t_database:              string,
		t_persistable:           T_Persistable,
		id:                      string,
		already_persisted:       boolean = false,
		awaiting_remoteCreation: boolean = false,
	) {
		this.awaiting_remoteCreation = awaiting_remoteCreation;
		this.already_persisted       = already_persisted;
		this.t_persistable           = t_persistable;
		this.t_database              = t_database;
		this.isDirty                 = this.isPersistent && !already_persisted;
		this.id                      = id;
	}

	wasModifiedWithinMS(threshold: number): boolean {
		const duration = new Date().getTime() - this.lastModifyDate.getTime();
		const result = duration < threshold;
		if (!result) {
			console.warn('slow: needs remote save');
		}
		return result;
	}

	async persist_withClosure(closure: Async_Handle_Boolean) {
		if (this.isPersistent) {
			if (this.awaiting_remoteCreation) {
				console.log(`awaiting creation ${this.t_persistable} ${this.id}`);
			} else {
				this.updateModifyDate();
				await closure(this.already_persisted);
			}
		}
	}

	setDate_fromSeriously(seriously_date: string) {
		const timestamp = parseFloat(seriously_date.split(':')[1]);
		const date = new Date(timestamp * 1000);
		const year = date.getFullYear() - 1994 + 2025;
		this.lastModifyDate = new Date(year, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
	}
}

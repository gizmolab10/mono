import { T_Persistable }   from '../common/Enumerations';
import { S_Persistence }   from '../state/S_Persistence';
import { Identifiable }    from './Identifiable';

export class Persistable extends Identifiable {
	t_persistable: T_Persistable;
	persistence:   S_Persistence;
	idBase:        string;

	constructor(
		t_database:        string,
		idBase:            string,
		t_persistable:     T_Persistable,
		id:                string,
		already_persisted: boolean = false,
	) {
		super(id);
		this.persistence   = new S_Persistence(t_database, t_persistable, id, already_persisted, false);
		this.t_persistable = t_persistable;
		this.idBase        = idBase;
	}

	get already_persisted(): boolean { return this.persistence.already_persisted; }

	async persistent_create_orUpdate(_already_persisted: boolean) {}

	isInDifferentBulkThan(other: Persistable) { return this.idBase !== other.idBase; }

	set_isDirty(flag: boolean = true) {
		this.persistence.isDirty = flag;
	}

	async persist() {
		await this.persistence.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

	static get t_persistables(): Array<T_Persistable> {
		return [
			T_Persistable.things,
			T_Persistable.traits,
			T_Persistable.predicates,
			T_Persistable.relationships,
			T_Persistable.tags,
		];
	}

	static dirty_count(persistables: Array<Persistable>): number {
		return persistables.filter(p => p.persistence.isDirty).length;
	}
}

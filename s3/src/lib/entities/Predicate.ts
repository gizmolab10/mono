import { Persistable }                 from './Persistable';
import { T_Predicate, T_Persistable } from '../common/Enumerations';

export class Predicate extends Persistable {
	kind:            string;
	isBidirectional: boolean;

	constructor(
		id:                string,
		kind:              string,
		isBidirectional:   boolean,
		already_persisted: boolean = false,
	) {
		super('', '', T_Persistable.predicates, id, already_persisted);
		this.kind            = kind;
		this.isBidirectional = isBidirectional;
	}

	static isBidirectional_for(kind: string): boolean {
		return kind !== T_Predicate.contains;
	}

	get description(): string {
		return this.kind.unCamelCase().lastWord();
	}
}

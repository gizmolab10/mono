import { Identifiable } from './Identifiable';
import { T_Predicate }   from '../common/Enumerations';

export class Predicate extends Identifiable {
	kind:            string;
	isBidirectional: boolean;

	constructor(
		id:                string,
		kind:              string,
		isBidirectional:   boolean,
		already_persisted: boolean = false,
	) {
		super(id);
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

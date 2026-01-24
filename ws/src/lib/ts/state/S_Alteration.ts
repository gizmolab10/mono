import { Ancestry, Predicate, T_Alteration } from '../common/Global_Imports';

export default class S_Alteration {
	t_alteration: T_Alteration;
	predicate: Predicate | null;
	ancestry!: Ancestry;

	constructor(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.t_alteration = t_alteration;
		this.ancestry = ancestry;
	}

	get description(): string { return `${this.t_alteration} ${this.predicate?.description ?? 'unpredicated'}`; }
}
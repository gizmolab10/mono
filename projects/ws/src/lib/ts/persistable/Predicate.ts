import { h, k, debug, radial, T_Debug, databases, Persistable } from '../common/Global_Imports';
import { T_Kinship, T_Predicate, T_Persistable } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class Predicate extends Persistable {
	isBidirectional: boolean;
	kind: T_Predicate;

	constructor(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = false) {
		super(databases.db_now.t_database, k.empty, T_Persistable.predicates, id, already_persisted);
		this.isBidirectional = isBidirectional;
		this.kind			 = kind;
	}
	
	log(option: T_Debug, message: string)					 { debug.log_maybe(option, message + k.space + this.description); }
	get description():					  			  string { return this.kind.unCamelCase().lastWord(); }
	static isBidirectional_for(kind: T_Predicate):	 boolean { return kind != T_Predicate.contains; }
	static get contains():				    Predicate | null { return this.predicate_forKind(T_Predicate.contains); }
	static get isTagged():					Predicate | null { return this.predicate_forKind(T_Predicate.isTagged); }
	static get requires():				    Predicate | null { return this.predicate_forKind(T_Predicate.requires); }
	static get isRelated():				    Predicate | null { return this.predicate_forKind(T_Predicate.isRelated); }
	static get alliedWith():				Predicate | null { return this.predicate_forKind(T_Predicate.alliedWith); }
	static get appreciates():			  	Predicate | null { return this.predicate_forKind(T_Predicate.appreciates); }
	static get explainedBy():				Predicate | null { return this.predicate_forKind(T_Predicate.explainedBy); }
	static get supportedBy():				Predicate | null { return this.predicate_forKind(T_Predicate.supportedBy); }
	static predicate_forKind(kind: string): Predicate | null { return h.predicate_forKind(kind) ?? null; }

	kinship_forChildren_cluster(isCluster_ofChildren: boolean): T_Kinship | null {
		switch (this.kind) {
			case T_Predicate.contains:	return isCluster_ofChildren ? T_Kinship.children : T_Kinship.parents;
			case T_Predicate.isRelated:	return T_Kinship.related;
			default:					return null;
		}
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.predicate_persistentUpdate(this);
		} else {
			await databases.db_now.predicate_remember_persistentCreate(this);
		}
	}
	
	angle_ofCluster_when(isCluster_ofChildren: boolean): number {
		// returns one of three angles: 1) children_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = 2 * Math.PI / 3;					// equilateral distribution
		const children_angle = get(radial.w_rotate_angle);
		const raw = this.isBidirectional ?
			children_angle + tweak :
			isCluster_ofChildren ? children_angle :		// one directional, use global
			children_angle - tweak;
		return raw.angle_normalized() ?? 0;
	}

}
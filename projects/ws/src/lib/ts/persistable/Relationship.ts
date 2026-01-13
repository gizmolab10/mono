import { h, k, x, Thing, T_Order, databases, Predicate } from '../common/Global_Imports';
import { T_Persistable, T_Predicate } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import type { Integer } from '../types/Types';
import Persistable from './Persistable';
import Airtable from 'airtable';

export default class Relationship extends Persistable {
	isReversed = false;
	hidParent: Integer;
	hidChild: Integer;
	kind: T_Predicate;
	idParent: string;
	idChild: string;
	orders = [0, 0];

	constructor(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string, orders: Array<number>, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.relationships, id, already_persisted);
		this.hidParent = idParent.hash();
		this.hidChild = idChild.hash();
		this.idParent = idParent;
		this.idChild = idChild;
		this.orders = orders;
		this.kind = kind;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get predicate(): Predicate | null { return h.predicate_forKind(this.kind); }
	get isValid(): boolean { return !!this.kind && !!this.parent && !!this.child; }
	get fields(): Airtable.FieldSet { return { kind: this.kind, parent: [this.idParent], child: [this.idChild], orders: this.orders.map(String) }; }
	get reversed(): Relationship | null { return h?.relationship_forPredicateKind_parent_child(this.kind, this.idChild.hash(), this.idParent.hash()) ?? null; }
	
	get verbose(): string {
		const persisted = this.persistence.already_persisted ? 'STORED' : 'DIRTY';
		return `BASE ${this.idBase} ${persisted} [${this.orders}] ${this.id} ${this.description}`;
	}

	get description(): string {
		const child = this.child ? this.child.description : this.idChild;
		const parent = this.parent ? this.parent.description : this.idParent;
		return `${parent} ${this.predicate?.kind} ${child}`;
	}

	get reversed_remember_createUnique(): Relationship {
		let reversed = this.reversed;
		if (!reversed) {
			reversed = new Relationship(this.idBase, Identifiable.id_inReverseOrder(this.id), this.kind, this.idChild, this.idParent, [...this.orders].reverse());
			reversed.isReversed = true;
			h.relationship_remember(reversed);
		}
		return reversed;
	}

	order_forPointsTo(isCluster_ofChildren: boolean): number {
		return isCluster_ofChildren ? this.orders[T_Order.child] : this.orders[T_Order.other];
	}

	remove_from(relationships: Array<Relationship>) {
		relationships.filter(t => t.kind != this.kind)
	}

	orders_setTo(newOrders: Array<number>) {
		this.order_setTo(newOrders[T_Order.child]);	// don't persist or signal, yet
		this.order_setTo(newOrders[T_Order.other], T_Order.other);
	}

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return h.thing_forHID(id.hash()) ?? null
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.relationship_persistentUpdate(this);
		} else {
			await databases.db_now.relationship_remember_persistentCreate(this);
		}
	}

	order_setTo_forPointsTo(order: number, toChildren: boolean = true) {
		const t_order = toChildren ? T_Order.child : T_Order.other;
		this.order_setTo(order, t_order);
	}

	order_setTo(newOrder: number, t_order: T_Order = T_Order.child) {
		const order = this.orders[t_order] ?? 0;
		const difference = Math.abs(order - newOrder);
		if (difference > 0.001) {
			this.orders[t_order] = newOrder;
			x.w_relationship_order.set(Date.now());
			this.set_isDirty();
		}
	}

	assign_idParent(idParent: string) {
		h.relationship_forget(this);
		this.idParent = idParent;
		this.hidParent = idParent.hash();
		this.set_isDirty();
		h.relationship_remember(this);
	}

}
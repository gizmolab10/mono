import { h, k, T_Thing, T_Trait, Predicate, T_Predicate } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Test extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.test;
	idBase = DB_Name.test;
	
	get details_forStorage(): Object { return ['data', 'recreated on launch'] }

	async fetch_all_fromLocal(): Promise<boolean> {
		const idTa = 'a';
		const idTb = 'b';
		const idTc = 'c';
		const idTd = 'd';
		const idTe = 'e';
		const idTf = 'f';
		const idTr = 'r';
		const contains = T_Predicate.contains;
		const related = T_Predicate.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Authentic');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Brilliant', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Companionable and Encouraging', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Diligent', 'mediumvioletred');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Excellence of breathable air', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTf, 'Friendly', 'coral');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTr, 'Life', 'limegreen', T_Thing.root);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cra', contains, idTr, idTa, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crb', contains, idTr, idTb, [1, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'crc', contains, idTr, idTc, [2, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cab', contains, idTa, idTb, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cac', contains, idTa, idTc, [1, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cad', contains, idTa, idTd, [2, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cae', contains, idTa, idTe, [3, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbc', contains, idTb, idTc, [0, 2]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbd', contains, idTb, idTd, [1, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbe', contains, idTb, idTe, [2, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'ccd', contains, idTc, idTd, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cce', contains, idTc, idTe, [1, 2]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'ccf', contains, idTc, idTf, [2, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cbf', contains, idTd, idTf, [3, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cef', contains, idTe, idTf, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rrb',  related, idTr, idTb, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rbd',  related, idTb, idTd, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rac',  related, idTa, idTc, [0, 0]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'raf',  related, idTa, idTf, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'rce',  related, idTc, idTe, [0, 1]);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'cfd', contains, idTd, idTe, [0, 3]);
		h.trait_remember_runtimeCreateUnique(this.idBase, 'ttc', idTc, T_Trait.text, 'Carrumba Tinga!');
		h.trait_remember_runtimeCreateUnique(this.idBase, 'tlb', idTb, T_Trait.link, 'http://www.webseriously.org');
		h.trait_remember_runtimeCreateUnique(this.idBase, 'ttb', idTb, T_Trait.text, 'What a brilliant idea you have!');
		h.tag_remember_runtimeCreateUnique_forType(this.idBase, 'f', 'Fruity', [idTd.hash(), idTc.hash()]);
		h.tag_remember_runtimeCreateUnique_forType(this.idBase, 'm', 'Moody', [idTf.hash(), idTd.hash(), idTb.hash()]);
		h.tag_remember_runtimeCreateUnique_forType(this.idBase, 's', 'Study', [idTc.hash(), idTe.hash()]);
		// this.makeMore(3, 'c', contains, idTf, true);	// children of Friendly
		this.makeMore(4, 'g', contains, idTb, true, 4);	// children of Brilliant
		this.makeMore(4, 'c', contains, idTb, false);	// parents of  "
		this.makeMore(4, 'e', related, idTb, true, 2);	// related to  "
		this.makeMore(4, 'k', related, idTr, true, 2);	// related to  Root
		return true;
	}

	makeMore(count: number, first: string, kind: T_Predicate, idRef: string, asChild: boolean, order: number = 0) {
		const isBidirectional = Predicate.isBidirectional_for(kind);
		const prefix = isBidirectional ? 'r' : 'c';
		const charCode = first.charCodeAt(0);
		for (let i = 0; i < count; i++) {
			const idCode = String.fromCharCode(charCode + i);
			const id_thing = asChild ? idRef + idCode : idCode + idRef;
			const title = asChild ? idCode : id_thing;
			const idParent = asChild ? idRef : idCode;
			const idChild = asChild ? idCode : idRef;
			const idRelationahip = prefix + id_thing;
			h.thing_remember_runtimeCreateUnique(this.idBase, idCode, title, 'grey');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kind, idParent, idChild, [i + order, 0]);
		}
	}

}

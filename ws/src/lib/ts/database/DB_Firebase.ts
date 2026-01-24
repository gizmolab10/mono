import { c, h, k, p, u, busy, Tag, Thing, Trait, builds, debug, g } from '../common/Global_Imports';
import { doc, addDoc, setDoc, getDocs, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { T_Create, T_Preference, T_Persistable } from '../common/Global_Imports';
import { T_Persistence } from '../common/Enumerations';
import { onSnapshot, deleteField, getFirestore, serverTimestamp } from 'firebase/firestore';
import { T_Thing, T_Trait, T_Debug, T_Order, T_Predicate } from '../common/Global_Imports';
import { databases, Predicate, Relationship, Persistable } from '../common/Global_Imports';
import { DocumentData, DocumentChange, DocumentReference } from 'firebase/firestore';
import { QuerySnapshot, CollectionReference } from 'firebase/firestore';
import type { Dictionary, Integer } from '../types/Types';
import Identifiable from '../runtime/Identifiable';
import { DB_Name, T_Database } from './DB_Common';
import { initializeApp } from 'firebase/app';
import DB_Common from './DB_Common';

export default class DB_Firebase extends DB_Common {
	config = {
		appId: "1:224721814373:web:0c60f394c056ef3decd78c",
		apiKey: "AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U",
		authDomain: "seriously-4536d.firebaseapp.com",
		storageBucket: "seriously-4536d.appspot.com",
		messagingSenderId: "224721814373",
		measurementId: "G-9PY9LVK813",
		projectId: "seriously-4536d"
	};

	addedTag!: Tag;
	addedThing!: Thing;
	addedTrait!: Trait;
	bulksName = 'Bulks';
	deferSnapshots = false;
	idBase = DB_Name.firebase;
	bulks: Dictionary<Bulk> = {};
	t_database = T_Database.firebase;
	app = initializeApp(this.config);
	firestore = getFirestore(this.app);
	t_persistence = T_Persistence.remote;
	predicatesCollection!: CollectionReference;
	deferredSnapshots: Array<SnapshotDeferal> = [];

	reportError(error: any) { console.log(error); }
	get displayName(): string { return this.idBase; }

	apply_queryStrings(queryStrings: URLSearchParams) {
		const persistedID = p.read_key(T_Preference.base_id);
		const id = queryStrings.get('name') ?? queryStrings.get('dbid') ?? persistedID ?? 'Public';
		p.write_key(T_Preference.base_id, id);
		this.idBase = id;
	}

	async remove_all() {
		const documentRef = doc(this.firestore, this.bulksName, this.idBase);
		await this.subcollections_persistentDeleteIn(documentRef);

		try {
			await deleteDoc(documentRef);
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly _____FETCH: unique symbol;

	async fetch_all(): Promise<boolean> {
		await busy.temporarily_set_isFetching_while(async () => {
			await this.recordLoginIP();
			await this.documents_fetch_ofType(T_Persistable.predicates);
			await this.hierarchy_fetch_forID(this.idBase);
			await this.setup_remote_handlers();
			await this.fetch_bulkAliases();		// TODO: assumes all ancestries are already created, including h.rootAncestry
		});
		return true;
	}

	async hierarchy_fetch_forID(idBase: string) {
		await this.documents_fetch_ofType(T_Persistable.relationships, idBase);
		await this.documents_fetch_ofType(T_Persistable.traits,		   idBase);
		await this.documents_fetch_ofType(T_Persistable.tags,		   idBase);
		await this.documents_fetch_ofType(T_Persistable.things,		   idBase);		// do this last so can translate ids in all others above
	}
		
	async documents_fetch_ofType(t_persistable: T_Persistable, idBase: string | null = null) {
		try {
			const collectionRef = !idBase ? collection(this.firestore, t_persistable) : collection(this.firestore, this.bulksName, idBase, t_persistable);
			let querySnapshot = await getDocs(collectionRef);
			if (!!idBase) {
				if (querySnapshot.empty) {
					await this.document_defaults_ofType_persistentCreateIn(t_persistable, idBase, collectionRef);
					querySnapshot = await getDocs(collectionRef);
				}
			}
			const docs = querySnapshot.docs;
			debug.log_remote('READ ' + docs.length + ' from ' + idBase + ':' + t_persistable);
			for (const docSnapshot of [...docs]) {
				const id = docSnapshot.id;
				const data = docSnapshot.data();
				this.document_ofType_remember_validated(t_persistable, id, data, idBase ?? this.idBase);
			}
		} catch (error) {
			this.reportError(error);
		}
	}

	static readonly _____BULKS: unique symbol;

	bulk_forID(idBase: string | null) {
		if (!idBase) {
			return null;
		}
		let bulk = this.bulks[idBase];
		if (!bulk) {
			bulk = new Bulk(idBase)
			this.bulks[idBase] = bulk;
		}
		return bulk;
	}
	
	async fetch_bulkAliases() {
		const root = h.root;
		if (!!root && this.idBase == k.name_bulkAdmin) {
			const externalsAncestry = await h.ancestry_externals;		// TODO: assumes all ancestries created
			if (!!externalsAncestry) {
				try {		// add bulk aliases to roots thing
					const bulk = collection(this.firestore, this.bulksName);	// fetch all bulks (documents)
					let bulkSnapshot = await getDocs(bulk);
					for (const bulkDoc of [...bulkSnapshot.docs]) {
						const idBulk = bulkDoc.id;
						if (idBulk != this.idBase) {
							let thing = h.bulkAlias_forTitle(idBulk);
							if (!thing) {								// create a thing for each bulk
								thing = h.thing_runtimeCreate(this.idBase, Identifiable.newID(), idBulk, 'red', T_Thing.bulk);
								await externalsAncestry.ancestry_persistentCreateUnique_byAddingThing(thing);
							} else if (thing.thing_isBulk_expanded) {
								await h.ancestry_redraw_persistentFetchBulk_browseRight(thing);		// preload
							}
						}
					}
					// TODO: detect when a root disappears
				} catch (error) {
					this.reportError(error);
				}
			}
		}
	}

	static readonly _____REMOTE: unique symbol;
	
	snapshot_deferOne(idBase: string, t_persistable: T_Persistable, snapshot: QuerySnapshot) {
		const deferral = new SnapshotDeferal(idBase, t_persistable, snapshot);
		this.deferredSnapshots.push(deferral);
	}

	async handle_deferredSnapshots() {
		let needsRebuild = false;
		this.deferSnapshots = false;
		let relationships_haveChanged = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.shift();
			if (!!deferral) {
				for (const change of [...deferral.snapshot.docChanges()]) {	// convert and remember
					if (await this.handle_docChanges(deferral.idBase, deferral.t_persistable, change)) {
						if (deferral.t_persistable == T_Persistable.relationships) {
							relationships_haveChanged = true;
						}
						needsRebuild = true;
					}
				};
			}
		}
		if (needsRebuild) {
			this.signal_docHandled(relationships_haveChanged);
		}
	}

	async setup_remote_handlers() {
		let rebuildScheduled = false;
		let relationships_haveChanged = false;
		for (const t_persistable of Persistable.t_persistables) {
			if (t_persistable == T_Persistable.predicates) {
				this.predicatesCollection = collection(this.firestore, t_persistable);
			} else {
				const idBase = this.idBase;
				const bulk = this.bulk_forID(idBase);
				const collectionRef = collection(this.firestore, this.bulksName, idBase, t_persistable);
				if (!!bulk) {
					switch (t_persistable) {
						case T_Persistable.tags:		  bulk.tagsCollection = collectionRef; break;
						case T_Persistable.things:		  bulk.thingsCollection = collectionRef; break;
						case T_Persistable.traits:		  bulk.traitsCollection = collectionRef; break;
						case T_Persistable.relationships: bulk.relationshipsCollection = collectionRef; break;
					}
				}
				onSnapshot(collectionRef, async (snapshot) => {
					if (h.isAssembled) {		// u.ignore snapshots caused by data written to server
						if (this.deferSnapshots) {
							this.snapshot_deferOne(idBase, t_persistable, snapshot);
							return;
						} else {
							for (const change of [...snapshot.docChanges()]) {	// convert and remember
								if (await this.handle_docChanges(idBase, t_persistable, change)) {
									if (t_persistable == T_Persistable.relationships) {
										relationships_haveChanged = true;
									}
									if (!rebuildScheduled) {
										rebuildScheduled = true;
										setTimeout(() => {		// defer signal_docHandled until after all handle_docChanges calls [microtasks] complete
											this.signal_docHandled(relationships_haveChanged);	  // so that this is called exactly once.
											relationships_haveChanged = false;
											rebuildScheduled = false;
										}, 0);
									}
								}
							}
						}
					}
				});
			}
		}
	}

	signal_docHandled(relationships_haveChanged: boolean) {
		if (relationships_haveChanged) {
			busy.signal_data_redraw();
			h.ancestries_fullRebuild();		// first recreate ancestries
			setTimeout(() => { // wait in case a thing involved in this relationship arrives in the data
				h.relationships_refreshKnowns();
				h.rootAncestry.order_normalizeRecursive();
				g.layout();
			}, 20);
		}
	}

	async handle_docChanges(idBase: string, t_persistable: T_Persistable, change: DocumentChange): Promise<boolean> {
		const doc = change.doc;
		const data = doc.data();
		let needsRebuild = false;
		if (DB_Firebase.data_isValidOfKind(t_persistable, data)) {
			const id = doc.id;

			//////////////////////////////
			//	ignores predicate data  //
			//////////////////////////////

			try {
				switch (t_persistable) {
					case T_Persistable.tags:		  needsRebuild = this.tag_handle_docChanges(idBase, id, change, data); break;
					case T_Persistable.things:		  needsRebuild = this.thing_handle_docChanges(idBase, id, change, data); break;
					case T_Persistable.traits:		  needsRebuild = this.trait_handle_docChanges(idBase, id, change, data); break;
					case T_Persistable.relationships: needsRebuild = this.relationship_handle_docChanges(idBase, id, change, data); break;
				}
			} catch (error) {
				this.reportError(error);
			}
			debug.log_remote('HANDLE ' + idBase + ':' + t_persistable + k.space + change.type);
		}
		return needsRebuild;
	}

	static readonly _____SUBCOLLECTIONS: unique symbol;

	async document_defaults_ofType_persistentCreateIn(t_persistable: T_Persistable, idBase: string, collectionRef: CollectionReference) {
		if (!!idBase) {
			const docRef = doc(this.firestore, this.bulksName, idBase);
			await setDoc(docRef, { isReal: true }, { merge: true });
			await updateDoc(docRef, { isReal: deleteField() });
		}
		switch (t_persistable) {
			case T_Persistable.predicates: h.predicate_defaults_remember_runtimeCreate(); break;
			case T_Persistable.things:	   await this.root_default_remember_persistentCreateIn(collectionRef); break;
		}
	}

	document_ofType_remember_validated(t_persistable: T_Persistable, id: string, data: DocumentData, idBase: string) {
		if (DB_Firebase.data_isValidOfKind(t_persistable, data)) {
			switch (t_persistable) {
				case T_Persistable.predicates:	  h   .predicate_remember_runtimeCreateUnique(		  id, data.kind,		 data.isBidirectional ); break;
				case T_Persistable.things:		  h       .thing_remember_runtimeCreateUnique(idBase, id, data.title,		 data.color,		  data.t_thing, true); break;
				case T_Persistable.relationships: h.relationship_remember_runtimeCreateUnique(idBase, id, data.predicate.id, data.parent.id,	  data.child.id, data.orders, T_Create.isFromPersistent); break;
				case T_Persistable.traits:		  h       .trait_remember_runtimeCreateUnique(idBase, id, data.ownerID,		 data.t_trait,		  data.text, true); break;
				case T_Persistable.tags:		  h  .tag_remember_runtimeCreateUnique_forType(idBase, id, data.type,		 data.thingHIDs,	  true); break;
			}
		}
	}
	
	async subcollections_persistentDeleteIn(docRef: DocumentReference) {
		const subcollectionNames = ['Things', 'Traits', 'Relationships'];
		for (const subcollectionName of [...subcollectionNames]) {	
			const subcollectionRef = collection(docRef, subcollectionName);
			const snapshot = await getDocs(subcollectionRef);
			for (const subDoc of [...snapshot.docs]) {
				await deleteDoc(subDoc.ref);
			}
		}
	}

	static readonly _____THING: unique symbol;

	async thing_remember_persistentCreate(thing: Thing) {
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			this.addedThing = thing;
			this.deferSnapshots = true;
			thing.persistence.awaiting_remoteCreation = true;
			try {
				const ref = await addDoc(thingsCollection, jsThing);
				h.thing_remember_updateID_to(thing, ref.id);
			} catch (error) {
				this.reportError(error);
			}
			thing.persistence.awaiting_remoteCreation = false;
			thing.persistence.already_persisted = true;
			await this.handle_deferredSnapshots();
			thing.log(T_Debug.remote, 'CREATE T');
		}
	}

	async root_default_remember_persistentCreateIn(collectionRef: CollectionReference) {
		const fields = ['title', 'color', 't_thing'];
		const root = new Thing(this.idBase, Identifiable.newID(), this.idBase, 'coral', T_Thing.root, true);
		const rootRef = await addDoc(collectionRef, u.convertToObject(root, fields));		// no need to remember now
		root.log(T_Debug.remote, 'CREATE T');
		h.root = root;
		root.setID(rootRef.id);
	}

	async thing_persistentUpdate(thing: Thing) {
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
			const remoteThing = new PersistentThing(thing);
			const jsThing = { ...remoteThing };
			try {
				await setDoc(ref, jsThing);
				thing.log(T_Debug.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async thing_persistentDelete(thing: Thing) {
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!!thingsCollection) {
			try {
				const ref = doc(thingsCollection, thing.id) as DocumentReference<Thing>;
				await deleteDoc(ref);
				thing.log(T_Debug.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	thing_extractChangesFromPersistent(thing: Thing, from: PersistentThing) {
		const changed = !from.isEqualTo(thing);
		if (changed) {
			thing.title	  = from.virginTitle;
			thing.color	  = from.color;
			thing.t_thing = from.t_thing;
		}
		return changed;
	}

	thing_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteThing = new PersistentThing(data);
		let thing = h.thing_forHID(id.hash());
		if (!remoteThing) {
			return false;
		} else {
			switch (change.type) {
				case 'added':
					if (!!thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.t_thing == T_Thing.root) {
						return false;			// do not invoke rebuild because nothing has changed
					}
					thing = h.thing_remember_runtimeCreate(idBase, id, remoteThing.title, remoteThing.color, remoteThing.t_thing, true);
					break;
				case 'removed':
					if (!!thing) {
						if (thing.isRoot) {
							thing.set_isDirty();
							return false;			// do not invoke rebuild
						}
						thing.remove_fromGrabbed_andExpanded_andResolveFocus();
						h.thing_forget(thing);
					}
					break;
				case 'modified':
					if (!thing || thing.persistence.wasModifiedWithinMS(800) || !this.thing_extractChangesFromPersistent(thing, remoteThing)) {
						return false;		// do not invoke rebuild
					}
					break;
			}
		}
		return true;
	}

	static readonly _____TRAIT: unique symbol;

	trait_extractChangesFromPersistent(trait: Trait, from: PersistentTrait) {
		const changed = !from.isEqualTo(trait);
		if (changed) {
			trait.t_trait = from.t_trait;
			trait.ownerID = from.ownerID;
			trait.text	  = from.text;
		}
		return changed;
	}

	async trait_persistentDelete(trait: Trait) {
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			try {
				const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
				await deleteDoc(ref);
				trait.log(T_Debug.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_persistentUpdate(trait: Trait) {
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			const ref = doc(traitsCollection, trait.id) as DocumentReference<Trait>;
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			try {
				await setDoc(ref, jsTrait);
				trait.log(T_Debug.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async trait_remember_persistentCreate(trait: Trait) {
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!!traitsCollection) {
			const remoteTrait = new PersistentTrait(trait);
			const jsTrait = { ...remoteTrait };
			this.addedTrait = trait;
			try {
				this.deferSnapshots = true;
				trait.persistence.awaiting_remoteCreation = true;
				const ref = await addDoc(traitsCollection, jsTrait)
				trait.persistence.awaiting_remoteCreation = false;
				trait.persistence.already_persisted = true;
				h.trait_forget(trait);
				trait.setID(ref.id);
				h.trait_remember(trait);
				await this.handle_deferredSnapshots();
				trait.log(T_Debug.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	trait_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteTrait = new PersistentTrait(data);
		if (!remoteTrait) {
			return false;
		} else {
			let trait = h.trait_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!trait || remoteTrait.isEqualTo(this.addedTrait)) {
						return false;		// do not invoke signal because nothing has changed
					}
					trait = h.trait_remember_runtimeCreate(idBase, id, remoteTrait.ownerID, remoteTrait.t_trait, remoteTrait.text, true);
					break;
				case 'removed':
					if (!!trait) {
						h.trait_forget(trait);
					}
					break;
				case 'modified':
					if (!trait || trait.persistence.wasModifiedWithinMS(800) || !this.trait_extractChangesFromPersistent(trait, remoteTrait)) {
						return false;		// do not invoke signal because nothing has changed
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this trait arrives in the data
				h.traits_refreshKnowns();
				g.grand_build();
			}, 20);
		}
		return true;
	}

	static readonly _____TAG: unique symbol;

	tag_extractChangesFromPersistent(tag: Tag, from: PersistentTag) {
		const changed = !from.isEqualTo(tag);
		if (changed) {
			tag.thingHIDs = from.thingHIDs;
			tag.type	  = from.type;
		}
		return changed;
	}

	async tag_persistentDelete(tag: Tag) {
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!!tagsCollection) {
			try {
				const ref = doc(tagsCollection, tag.id) as DocumentReference<Tag>;
				await deleteDoc(ref);
				tag.log(T_Debug.remote, 'DELETE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async tag_persistentUpdate(tag: Tag) {
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!!tagsCollection) {
			const ref = doc(tagsCollection, tag.id) as DocumentReference<Tag>;
			const remoteTag = new PersistentTag(tag);
			const jsTag = { ...remoteTag };
			try {
				await setDoc(ref, jsTag);
				tag.log(T_Debug.remote, 'UPDATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async tag_remember_persistentCreate(tag: Tag) {
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!!tagsCollection) {
			const remoteTag = new PersistentTag(tag);
			const jsTag = { ...remoteTag };
			this.addedTag = tag;
			try {
				this.deferSnapshots = true;
				tag.persistence.awaiting_remoteCreation = true;
				const ref = await addDoc(tagsCollection, jsTag)
				tag.persistence.awaiting_remoteCreation = false;
				tag.persistence.already_persisted = true;
				h.tag_forget(tag);
				tag.setID(ref.id);
				h.tag_remember(tag);
				await this.handle_deferredSnapshots();
				tag.log(T_Debug.remote, 'CREATE T');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	tag_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteTag = new PersistentTag(data);
		if (!remoteTag) {
			return false;
		} else {
			let tag = h.tag_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!tag || remoteTag.isEqualTo(this.addedTag)) {
						return false;		// do not invoke signal because nothing has changed
					}
					tag = h.tag_remember_runtimeCreateUnique_forType(idBase, id, remoteTag.type, remoteTag.thingHIDs, true);
					break;
				case 'removed':
					if (!!tag) {
						h.tag_forget(tag);
					}
					break;
				case 'modified':
					if (!tag || tag.persistence.wasModifiedWithinMS(800) || !this.tag_extractChangesFromPersistent(tag, remoteTag)) {
						return false;		// do not invoke signal because nothing has changed
					}
					break;
			}
			setTimeout(() => { // wait in case a thing involved in this tag arrives in the data
				h.tags_refreshKnowns();
				g.grand_build();
			}, 20);
		}
		return true;
	}
	
	static readonly _____PREDICATE: unique symbol;

	async predicate_persistentUpdate(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			try {
				const ref = doc(predicatesCollection, predicate.id) as DocumentReference<PersistentPredicate>;
				const remotePredicate = new PersistentPredicate(predicate);
				const jsPredicate = { ...remotePredicate };
				await setDoc(ref, jsPredicate);
				predicate.log(T_Debug.remote, 'UPDATE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async predicate_persistentDelete(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			try {
				const ref = doc(predicatesCollection, predicate.id) as DocumentReference<PersistentPredicate>;
				await deleteDoc(ref);
				predicate.log(T_Debug.remote, 'DELETE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}
	async predicate_remember_persistentCreate(predicate: Predicate) {
		const predicatesCollection = this.predicatesCollection;
		if (!!predicatesCollection) {
			const remotePredicate = new PersistentPredicate(predicate);
			const jsPredicate = { ...remotePredicate };
			try {
				this.deferSnapshots = true;
				predicate.persistence.awaiting_remoteCreation = true;
				const ref = await addDoc(predicatesCollection, jsPredicate);
				predicate.persistence.awaiting_remoteCreation = false;
				predicate.persistence.already_persisted = true;
				h.predicate_forget(predicate);
				predicate.setID(ref.id);
				h.predicate_remember(predicate);
				await this.handle_deferredSnapshots();
				predicate.log(T_Debug.remote, 'CREATE P');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	static readonly _____RELATIONSHIP: unique symbol;

	async relationship_persistentDelete(relationship: Relationship) {
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				await deleteDoc(ref);
				relationship.log(T_Debug.remote, 'DELETE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	async relationship_persistentUpdate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			try {
				const ref = doc(relationshipsCollection, relationship.id) as DocumentReference<PersistentRelationship>;
				const remoteRelationship = new PersistentRelationship(relationship);
				const jsRelationship = { ...remoteRelationship };
				await setDoc(ref, jsRelationship);
				relationship.log(T_Debug.remote, 'UPDATE R');
			} catch (error) {
				this.reportError(error);
			}
		}
	}

	relationship_extractChangesFromPersistent(relationship: Relationship, remote: PersistentRelationship) {
		const changed = (relationship.kind != remote.predicate.id ||
			relationship.idParent != remote.parent.id ||
			relationship.idChild != remote.child.id ||
			relationship.orders != remote.orders)
		if (changed) {
			relationship.kind = remote.kind;
			relationship.idChild = remote.child.id;
			relationship.idParent = remote.parent.id;
			relationship.hidChild = remote.child.id.hash();
			relationship.hidParent = remote.parent.id.hash();
			relationship.persistence.already_persisted = true;
			relationship.order_setTo(remote.orders[T_Order.child] ?? 0 + k.halfIncrement);
		}
		return changed;
	}

	async relationship_remember_persistentCreate(relationship: Relationship) {
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!!relationshipsCollection) {
			const remoteRelationship = new PersistentRelationship(relationship);
			const jsRelationship = { ...remoteRelationship };
			this.deferSnapshots = true;
			relationship.persistence.awaiting_remoteCreation = true;
			try {
				const ref = await addDoc(relationshipsCollection, jsRelationship);
				h.relationship_forget(relationship);
				relationship.setID(ref.id);
				h.relationship_remember(relationship);
			} catch (error) {
				this.reportError(error);
			}
			relationship.persistence.awaiting_remoteCreation = false;
			relationship.persistence.already_persisted = true;
			await this.handle_deferredSnapshots();
			relationship.log(T_Debug.remote, 'CREATE R');
		}
	}

	relationship_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteRelationship = new PersistentRelationship(data);
		if (!remoteRelationship) {
			return false;
		} else {
			let relationship = h.relationship_forHID(id.hash());
			switch (change.type) {
				case 'added':
					if (!!relationship) {
						return false;
					}
					relationship = h.relationship_remember_runtimeCreateUnique(idBase, id, remoteRelationship.kind, remoteRelationship.parent.id, remoteRelationship.child.id, remoteRelationship.orders, T_Create.isFromPersistent);
					break;
				default:
					if (!relationship) {
						return false;	// not known so do not signal
					} else {
						switch (change.type) {
							case 'modified':
								if (relationship.persistence.wasModifiedWithinMS(800) || !this.relationship_extractChangesFromPersistent(relationship, remoteRelationship)) {
									return false;	// already known and contains no new data, or needs to be 'tamed'
								}
								break;
							case 'removed':
								h.relationship_forget(relationship);
								break;
						}
					}
					break;
			}
		}
		return true;
	}

	static readonly _____VALIDATION: unique symbol;

	static data_isValidOfKind(t_persistable: T_Persistable, data: DocumentData) {
		switch (t_persistable) {
			case T_Persistable.things:		
				const thing = data as PersistentThing;	
				if (thing.hasNoData) {
					return false;
				}
				break;
			case T_Persistable.traits:		
				const trait = data as PersistentTrait;	
				if (trait.hasNoData) {
					return false;
				}
				break;
			case T_Persistable.tags:
				const tag = data as PersistentTag;
				if (!tag.thingHIDs || !tag.type) {
					return false;
				}
				break;
			case T_Persistable.relationships:
				const relationship = data as PersistentRelationship;
				if (!relationship.predicate || !relationship.parent || !relationship.child) {
					return false;
				}
				break;
			case T_Persistable.predicates:
				if (!data.kind) {
					return false;
				}
				break;
			default:
				return false;
		}
		return true;
	}

	async recordLoginIP() {
		await this.getUserIPAddress().then( async (ipAddress) => {
			if (!!ipAddress && ipAddress != '69.181.235.85') {
				const queryStrings = c.queryStrings.toString() ?? 'empty';
				const logRef = collection(this.firestore, 'access_logs');
				const item = {
					queries: queryStrings,
					build: builds.build_number,
					ipAddress: ipAddress,
					timestamp: serverTimestamp(),
				}
				const jsItem = { ...item };
				try {
					await addDoc(logRef, jsItem);
				} catch (error) {
					this.reportError(error);
				}
			}
		});
	}
	
	async getUserIPAddress(): Promise<string | null> {
		try {
			// Use an externals service to determine the IP address (you can replace this URL with a different service if needed).
			const response = await fetch('https://ipv4.icanhazip.com');
			if (!response.ok) {
				throw new Error('Unable to fetch IP address.');
			}
			const ipAddress = await response.text();
			return ipAddress.replace(/\n/g, k.empty);
		} catch (error) {
			this.reportError('Error fetching IP address:' + error);
			return null;
		}
	}

}

export class Bulk {
	idBase: string = DB_Name.bulks;
	tagsCollection: CollectionReference | null = null;
	thingsCollection: CollectionReference | null = null;
	traitsCollection: CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;
	constructor(idBase: string) {
		this.idBase = idBase;
	}
}

export class SnapshotDeferal {
	t_persistable: T_Persistable;
	snapshot: QuerySnapshot;
	idBase: string;

	constructor(idBase: string, t_persistable: T_Persistable, snapshot: QuerySnapshot) {
		this.t_persistable = t_persistable;
		this.snapshot = snapshot;
		this.idBase = idBase;
	}
}

export class PersistentThing {
	t_thing: T_Thing;
	title: string;
	color: string;

	constructor(data: DocumentData) {
		const remote = data as PersistentThing;
		this.t_thing = remote.t_thing;
		this.title	 = remote.title;
		this.color	 = remote.color;
	}

	get hasNoData(): boolean { return !this.title && !this.color && !this.t_thing; }

	get virginTitle(): string {
		const title = this.title;
		if (title.includes('@')) {
			const dual = title.split('@');
			return dual[0];
		}
		return title
	}

	isEqualTo(thing: Thing | null) {
		return !!thing &&
		thing.t_thing == this.t_thing &&
		thing.title == this.title &&
		thing.color == this.color;
	}
}

export class PersistentTrait {
	t_trait: T_Trait;
	ownerID: string;
	text: string;

	constructor(data: DocumentData) {
		const remote = data as PersistentTrait;
		this.ownerID = remote.ownerID;
		this.t_trait = remote.t_trait;
		this.text	 = remote.text;
	}
	
	get hasNoData(): boolean { return !this.ownerID && !this.t_trait; }

	isEqualTo(trait: Trait | null) {
		return !!trait &&
		trait.ownerID == this.ownerID &&
		trait.t_trait == this.t_trait &&
		trait.text	  == this.text;
	}
}

export class PersistentTag {
	thingHIDs: Array<Integer>;
	type: string;
	
	isEqualTo(tag: Tag | null) { return !!tag && tag.thingHIDs == this.thingHIDs; }
	get hasNoData(): boolean { return !this.thingHIDs && !this.type; }

	constructor(data: DocumentData) {
		const remote = data as PersistentTag;
		this.thingHIDs = remote.thingHIDs;
		this.type = remote.type;
	}
}

export class PersistentPredicate {
	isBidirectional: boolean;
	kind: T_Predicate;

	constructor(data: DocumentData) {
		const remote		 = data as PersistentPredicate;
		this.isBidirectional = remote.isBidirectional;
		this.kind			 = remote.kind;
	}

	isEqualTo(predicate: Predicate | null) {
		return !!predicate &&
		predicate.isBidirectional == this.isBidirectional &&
		predicate.kind			  == this.kind;
	}
}

export class PersistentRelationship implements PersistentRelationship {
	predicate!: DocumentReference<Predicate, DocumentData>;
	parent!: DocumentReference<Thing, DocumentData>;
	child!: DocumentReference<Thing, DocumentData>;
	orders: Array<number>;
	kind!: T_Predicate;

	constructor(data: DocumentData | Relationship) {
		const dbFirebase = databases.db_forType(T_Database.firebase) as DB_Firebase;
		const things = dbFirebase.bulk_forID(dbFirebase.idBase)?.thingsCollection;
		const predicates = dbFirebase.predicatesCollection;
		this.orders = data.orders;
		if (!!things && !!predicates) {
			try {
				if (data instanceof Relationship) {
					if (data.isValid) {
						this.kind = data.kind;
						this.child = doc(things, data.idChild) as DocumentReference<Thing>;
						this.parent = doc(things, data.idParent) as DocumentReference<Thing>;
						this.predicate = doc(predicates, data.kind) as DocumentReference<Predicate>;
					}
				} else {
					const remote = data as PersistentRelationship;
					if (DB_Firebase.data_isValidOfKind(T_Persistable.relationships, data)) {
						this.kind = data.kind;
						this.child = doc(things, remote.child.id) as DocumentReference<Thing>;
						this.parent = doc(things, remote.parent.id) as DocumentReference<Thing>;
						this.predicate = doc(predicates, remote.predicate.id) as DocumentReference<Predicate>;
					}
				}
			} catch (error) {
				dbFirebase.reportError(error);
			}
		}
	}

	async isEqualTo(relationship: Relationship | null) {
		return !!relationship &&
		relationship.kind == await this.kind &&
		relationship.idParent == this.parent.id &&
		relationship.idChild == this.child.id &&
		relationship.orders == this.orders;
	}

}

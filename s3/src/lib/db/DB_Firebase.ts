import { doc, addDoc, setDoc, getDocs, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { getFirestore, serverTimestamp }                                    from 'firebase/firestore';
import type { DocumentData, DocumentChange, CollectionReference }          from 'firebase/firestore';
import type { QuerySnapshot }                                              from 'firebase/firestore';
import { initializeApp }                                                   from 'firebase/app';
import { T_Persistence, T_Persistable, T_Thing, T_Predicate }             from '../common/Enumerations';
import { DB_Common, T_Database }                                           from './DB_Common';
import { PersistentThing, PersistentTrait, PersistentTag }                 from './Persistent';
import { PersistentPredicate, PersistentRelationship, data_isValidOfKind } from './Persistent';
import { Thing }                                                           from '../entities/Thing';
import { Relationship }                                                    from '../entities/Relationship';
import { Predicate }                                                       from '../entities/Predicate';
import { Trait }                                                           from '../entities/Trait';
import { Tag }                                                             from '../entities/Tag';
import { Identifiable }                                                    from '../entities/Identifiable';
import { store }                                                           from '../store/store.svelte';
import type { Dictionary }                                                 from '../types/Types';

// ————————————————————————————————————————— Bulk

class Bulk {
	idBase: string;
	tagsCollection:          CollectionReference | null = null;
	thingsCollection:        CollectionReference | null = null;
	traitsCollection:        CollectionReference | null = null;
	relationshipsCollection: CollectionReference | null = null;

	constructor(idBase: string) { this.idBase = idBase; }
}

// ————————————————————————————————————————— SnapshotDeferal

class SnapshotDeferal {
	t_persistable: T_Persistable;
	snapshot:      QuerySnapshot;
	idBase:        string;

	constructor(idBase: string, t_persistable: T_Persistable, snapshot: QuerySnapshot) {
		this.t_persistable = t_persistable;
		this.snapshot       = snapshot;
		this.idBase         = idBase;
	}
}

// ————————————————————————————————————————— DB_Firebase

export class DB_Firebase extends DB_Common {
	t_persistence = T_Persistence.remote;
	t_database    = T_Database.firebase;
	idBase        = 'Public';

	private config = {
		appId:             '1:224721814373:web:0c60f394c056ef3decd78c',
		apiKey:            'AIzaSyAFy4H3Ej5zfI46fvCJpBfUxmyQco-dx9U',
		authDomain:        'seriously-4536d.firebaseapp.com',
		storageBucket:     'seriously-4536d.appspot.com',
		messagingSenderId: '224721814373',
		measurementId:     'G-9PY9LVK813',
		projectId:         'seriously-4536d',
	};

	private app       = initializeApp(this.config);
	private firestore = getFirestore(this.app);
	private bulksName = 'Bulks';

	private bulks:               Dictionary<Bulk> = {};
	private deferSnapshots       = false;
	private deferredSnapshots:   SnapshotDeferal[] = [];
	private predicatesCollection!: CollectionReference;
	private isAssembled          = false;

	// Echo suppression: track the last locally-created entity to skip its snapshot
	private addedThing!: Thing;
	private addedTrait!: Trait;
	private addedTag!:   Tag;

	// ————————————————————————————————————————— Query strings

	apply_queryStrings(queryStrings: URLSearchParams): void {
		const id = queryStrings.get('name') ?? queryStrings.get('dbid') ?? 'Public';
		this.idBase = id;
	}

	// ————————————————————————————————————————— Fetch

	async fetch_all(): Promise<void> {
		await this.recordLoginIP();
		await this.documents_fetch_ofType(T_Persistable.predicates);
		await this.hierarchy_fetch_forID(this.idBase);
		this.setup_remote_handlers();
		this.isAssembled = true;
	}

	private async hierarchy_fetch_forID(idBase: string): Promise<void> {
		await this.documents_fetch_ofType(T_Persistable.relationships, idBase);
		await this.documents_fetch_ofType(T_Persistable.traits,        idBase);
		await this.documents_fetch_ofType(T_Persistable.tags,          idBase);
		await this.documents_fetch_ofType(T_Persistable.things,        idBase);  // last — so IDs in others can be translated
	}

	private async documents_fetch_ofType(t_persistable: T_Persistable, idBase: string | null = null): Promise<void> {
		try {
			const collectionRef = !idBase
				? collection(this.firestore, t_persistable)
				: collection(this.firestore, this.bulksName, idBase, t_persistable);

			let querySnapshot = await getDocs(collectionRef);

			if (idBase && querySnapshot.empty) {
				await this.document_defaults_ofType_persistentCreateIn(t_persistable, idBase, collectionRef);
				querySnapshot = await getDocs(collectionRef);
			}

			for (const docSnapshot of querySnapshot.docs) {
				this.document_ofType_remember_validated(t_persistable, docSnapshot.id, docSnapshot.data(), idBase ?? this.idBase);
			}
		} catch (error) {
			console.error('DB_Firebase fetch error:', error);
		}
	}

	// ————————————————————————————————————————— Document → Store

	private document_ofType_remember_validated(t_persistable: T_Persistable, id: string, data: DocumentData, idBase: string): void {
		if (!data_isValidOfKind(t_persistable, data)) return;

		switch (t_persistable) {
			case T_Persistable.predicates:
				store.remember_predicate(new Predicate(id, data.kind, data.isBidirectional));
				break;
			case T_Persistable.things:
				store.remember_thing(new Thing(idBase, id, data.title, data.color, data.t_thing ?? T_Thing.generic, true));
				break;
			case T_Persistable.relationships:
				store.remember_relationship(new Relationship(idBase, id, data.kind ?? data.predicate?.id, data.parent.id, data.child.id, data.orders ?? [0, 0], true));
				break;
			case T_Persistable.traits:
				store.remember_trait(new Trait(idBase, id, data.ownerID, data.t_trait, data.text ?? '', true));
				break;
			case T_Persistable.tags:
				store.remember_tag(new Tag(idBase, id, data.type, data.thingHIDs ?? [], true));
				break;
		}
	}

	// ————————————————————————————————————————— Defaults

	private async document_defaults_ofType_persistentCreateIn(t_persistable: T_Persistable, idBase: string, collectionRef: CollectionReference): Promise<void> {
		// Ensure the bulk document exists
		const docRef = doc(this.firestore, this.bulksName, idBase);
		await setDoc(docRef, { isReal: true }, { merge: true });

		switch (t_persistable) {
			case T_Persistable.predicates:
				this.predicate_defaults_remember();
				break;
			case T_Persistable.things:
				await this.root_default_remember_persistentCreateIn(collectionRef);
				break;
		}
	}

	private predicate_defaults_remember(): void {
		const kinds: [string, boolean][] = [
			[T_Predicate.contains,    false],
			[T_Predicate.isRelated,   true],
			[T_Predicate.isTagged,    true],
			[T_Predicate.requires,    true],
			[T_Predicate.alliedWith,  true],
			[T_Predicate.appreciates, true],
			[T_Predicate.explainedBy, true],
			[T_Predicate.supportedBy, true],
		];
		for (const [kind, bidir] of kinds) {
			store.remember_predicate(new Predicate(kind, kind, bidir));
		}
	}

	private async root_default_remember_persistentCreateIn(collectionRef: CollectionReference): Promise<void> {
		const root = new Thing(this.idBase, Identifiable.newID(), this.idBase, 'coral', T_Thing.root, true);
		const rootRef = await addDoc(collectionRef, { title: root.title, color: root.color, t_thing: root.t_thing });
		root.setID(rootRef.id);
		store.remember_thing(root);
	}

	// ————————————————————————————————————————— Bulks

	private bulk_forID(idBase: string | null): Bulk | null {
		if (!idBase) return null;
		let bulk = this.bulks[idBase];
		if (!bulk) {
			bulk = new Bulk(idBase);
			this.bulks[idBase] = bulk;
		}
		return bulk;
	}

	// ————————————————————————————————————————— Real-time listeners

	private setup_remote_handlers(): void {
		let rebuildScheduled = false;
		let relationships_haveChanged = false;

		for (const t_persistable of [T_Persistable.predicates, T_Persistable.things, T_Persistable.relationships, T_Persistable.traits, T_Persistable.tags]) {
			if (t_persistable === T_Persistable.predicates) {
				this.predicatesCollection = collection(this.firestore, t_persistable);
			} else {
				const idBase        = this.idBase;
				const bulk          = this.bulk_forID(idBase);
				const collectionRef = collection(this.firestore, this.bulksName, idBase, t_persistable);

				if (bulk) {
					switch (t_persistable) {
						case T_Persistable.tags:          bulk.tagsCollection          = collectionRef; break;
						case T_Persistable.things:        bulk.thingsCollection        = collectionRef; break;
						case T_Persistable.traits:        bulk.traitsCollection        = collectionRef; break;
						case T_Persistable.relationships: bulk.relationshipsCollection = collectionRef; break;
					}
				}

				onSnapshot(collectionRef, async (snapshot) => {
					if (!this.isAssembled) return;

					if (this.deferSnapshots) {
						this.snapshot_deferOne(idBase, t_persistable, snapshot);
						return;
					}

					for (const change of snapshot.docChanges()) {
						if (this.handle_docChanges(idBase, t_persistable, change)) {
							if (t_persistable === T_Persistable.relationships) {
								relationships_haveChanged = true;
							}
							if (!rebuildScheduled) {
								rebuildScheduled = true;
								setTimeout(() => {
									this.signal_docHandled(relationships_haveChanged);
									relationships_haveChanged = false;
									rebuildScheduled = false;
								}, 0);
							}
						}
					}
				});
			}
		}
	}

	private signal_docHandled(_relationships_haveChanged: boolean): void {
		// Trigger re-render by nudging the store (Svelte 5 $state reactivity handles the rest)
		// When relationships change, ancestry-based derived state will automatically update
	}

	// ————————————————————————————————————————— Snapshot deferral

	private snapshot_deferOne(idBase: string, t_persistable: T_Persistable, snapshot: QuerySnapshot): void {
		this.deferredSnapshots.push(new SnapshotDeferal(idBase, t_persistable, snapshot));
	}

	private handle_deferredSnapshots(): void {
		this.deferSnapshots = false;
		while (this.deferredSnapshots.length > 0) {
			const deferral = this.deferredSnapshots.shift();
			if (deferral) {
				for (const change of deferral.snapshot.docChanges()) {
					this.handle_docChanges(deferral.idBase, deferral.t_persistable, change);
				}
			}
		}
	}

	// ————————————————————————————————————————— Doc change dispatch

	private handle_docChanges(idBase: string, t_persistable: T_Persistable, change: DocumentChange): boolean {
		const data = change.doc.data();
		if (!data_isValidOfKind(t_persistable, data)) return false;

		const id = change.doc.id;
		try {
			switch (t_persistable) {
				case T_Persistable.things:        return this.thing_handle_docChanges(idBase, id, change, data);
				case T_Persistable.traits:        return this.trait_handle_docChanges(idBase, id, change, data);
				case T_Persistable.tags:          return this.tag_handle_docChanges(idBase, id, change, data);
				case T_Persistable.relationships: return this.relationship_handle_docChanges(idBase, id, change, data);
			}
		} catch (error) {
			console.error('DB_Firebase handle_docChanges error:', error);
		}
		return false;
	}

	// ————————————————————————————————————————— Thing changes

	private thing_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteThing = new PersistentThing(data);
		const thing       = store.things.get(id) ?? null;

		switch (change.type) {
			case 'added':
				if (thing || remoteThing.isEqualTo(this.addedThing) || remoteThing.t_thing === T_Thing.root) {
					return false;
				}
				store.remember_thing(new Thing(idBase, id, remoteThing.title, remoteThing.color, remoteThing.t_thing, true));
				break;
			case 'removed':
				if (thing) {
					if (thing.isRoot) {
						thing.set_isDirty();
						return false;
					}
					store.things.delete(id);
				}
				break;
			case 'modified':
				if (!thing || thing.persistence.wasModifiedWithinMS(800)) return false;
				if (!this.thing_extractChangesFromPersistent(thing, remoteThing)) return false;
				break;
		}
		return true;
	}

	private thing_extractChangesFromPersistent(thing: Thing, from: PersistentThing): boolean {
		const changed = !from.isEqualTo(thing);
		if (changed) {
			thing.title   = from.virginTitle;
			thing.color   = from.color;
			thing.t_thing = from.t_thing;
		}
		return changed;
	}

	// ————————————————————————————————————————— Trait changes

	private trait_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteTrait = new PersistentTrait(data);
		const trait       = store.traits.get(id) ?? null;

		switch (change.type) {
			case 'added':
				if (trait || remoteTrait.isEqualTo(this.addedTrait)) return false;
				store.remember_trait(new Trait(idBase, id, remoteTrait.ownerID, remoteTrait.t_trait, remoteTrait.text, true));
				break;
			case 'removed':
				if (trait) store.traits.delete(id);
				break;
			case 'modified':
				if (!trait || trait.persistence.wasModifiedWithinMS(800)) return false;
				if (!this.trait_extractChangesFromPersistent(trait, remoteTrait)) return false;
				break;
		}
		return true;
	}

	private trait_extractChangesFromPersistent(trait: Trait, from: PersistentTrait): boolean {
		const changed = !from.isEqualTo(trait);
		if (changed) {
			trait.t_trait = from.t_trait;
			trait.ownerID = from.ownerID;
			trait.text    = from.text;
		}
		return changed;
	}

	// ————————————————————————————————————————— Tag changes

	private tag_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remoteTag = new PersistentTag(data);
		const tag       = store.tags.get(id) ?? null;

		switch (change.type) {
			case 'added':
				if (tag || remoteTag.isEqualTo(this.addedTag)) return false;
				store.remember_tag(new Tag(idBase, id, remoteTag.type, remoteTag.thingHIDs, true));
				break;
			case 'removed':
				if (tag) store.tags.delete(id);
				break;
			case 'modified':
				if (!tag || tag.persistence.wasModifiedWithinMS(800)) return false;
				if (!this.tag_extractChangesFromPersistent(tag, remoteTag)) return false;
				break;
		}
		return true;
	}

	private tag_extractChangesFromPersistent(tag: Tag, from: PersistentTag): boolean {
		const changed = !from.isEqualTo(tag);
		if (changed) {
			tag.thingHIDs = from.thingHIDs;
			tag.type      = from.type;
		}
		return changed;
	}

	// ————————————————————————————————————————— Relationship changes

	private relationship_handle_docChanges(idBase: string, id: string, change: DocumentChange, data: DocumentData): boolean {
		const remote       = new PersistentRelationship(data);
		const relationship = store.relationships.get(id) ?? null;

		switch (change.type) {
			case 'added':
				if (relationship) return false;
				store.remember_relationship(new Relationship(
					idBase, id, remote.kind ?? remote.predicate?.id,
					remote.parent?.id, remote.child?.id,
					remote.orders, true
				));
				break;
			case 'removed':
				if (relationship) store.relationships.delete(id);
				break;
			case 'modified':
				if (!relationship || relationship.persistence.wasModifiedWithinMS(800)) return false;
				if (!this.relationship_extractChangesFromPersistent(relationship, remote)) return false;
				break;
		}
		return true;
	}

	private relationship_extractChangesFromPersistent(relationship: Relationship, remote: PersistentRelationship): boolean {
		const changed =
			relationship.kind     !== (remote.kind ?? remote.predicate?.id) ||
			relationship.idParent !== remote.parent?.id ||
			relationship.idChild  !== remote.child?.id;
		if (changed) {
			relationship.kind      = remote.kind ?? remote.predicate?.id;
			relationship.idChild   = remote.child?.id;
			relationship.idParent  = remote.parent?.id;
			relationship.hidChild  = remote.child?.id?.hash() ?? 0;
			relationship.hidParent = remote.parent?.id?.hash() ?? 0;
			relationship.persistence.already_persisted = true;
		}
		return changed;
	}

	// ————————————————————————————————————————— CRUD: Thing

	async persistent_create_thing(id: string): Promise<void> {
		const thing = store.things.get(id);
		if (!thing) return;
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!thingsCollection) return;

		const remoteThing = new PersistentThing(thing);
		this.addedThing    = thing;
		this.deferSnapshots = true;
		thing.persistence.awaiting_remoteCreation = true;
		try {
			const ref = await addDoc(thingsCollection, { ...remoteThing });
			store.things.delete(thing.id);
			thing.setID(ref.id);
			store.things.set(thing.id, thing);
		} catch (error) {
			console.error('DB_Firebase create thing error:', error);
		}
		thing.persistence.awaiting_remoteCreation = false;
		thing.persistence.already_persisted       = true;
		this.handle_deferredSnapshots();
	}

	async persistent_update_thing(id: string): Promise<void> {
		const thing = store.things.get(id);
		if (!thing) return;
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!thingsCollection) return;

		const ref         = doc(thingsCollection, thing.id);
		const remoteThing = new PersistentThing(thing);
		try {
			await setDoc(ref, { ...remoteThing });
		} catch (error) {
			console.error('DB_Firebase update thing error:', error);
		}
	}

	async persistent_delete_thing(id: string): Promise<void> {
		const thing = store.things.get(id);
		if (!thing) return;
		const thingsCollection = this.bulk_forID(thing.idBase)?.thingsCollection;
		if (!thingsCollection) return;

		try {
			await deleteDoc(doc(thingsCollection, thing.id));
		} catch (error) {
			console.error('DB_Firebase delete thing error:', error);
		}
	}

	// ————————————————————————————————————————— CRUD: Trait

	async persistent_create_trait(id: string): Promise<void> {
		const trait = store.traits.get(id);
		if (!trait) return;
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!traitsCollection) return;

		const remoteTrait = new PersistentTrait(trait);
		this.addedTrait     = trait;
		this.deferSnapshots = true;
		trait.persistence.awaiting_remoteCreation = true;
		try {
			const ref = await addDoc(traitsCollection, { ...remoteTrait });
			store.traits.delete(trait.id);
			trait.setID(ref.id);
			store.traits.set(trait.id, trait);
		} catch (error) {
			console.error('DB_Firebase create trait error:', error);
		}
		trait.persistence.awaiting_remoteCreation = false;
		trait.persistence.already_persisted       = true;
		this.handle_deferredSnapshots();
	}

	async persistent_update_trait(id: string): Promise<void> {
		const trait = store.traits.get(id);
		if (!trait) return;
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!traitsCollection) return;

		try {
			await setDoc(doc(traitsCollection, trait.id), { ...new PersistentTrait(trait) });
		} catch (error) {
			console.error('DB_Firebase update trait error:', error);
		}
	}

	async persistent_delete_trait(id: string): Promise<void> {
		const trait = store.traits.get(id);
		if (!trait) return;
		const traitsCollection = this.bulk_forID(trait.idBase)?.traitsCollection;
		if (!traitsCollection) return;

		try {
			await deleteDoc(doc(traitsCollection, trait.id));
		} catch (error) {
			console.error('DB_Firebase delete trait error:', error);
		}
	}

	// ————————————————————————————————————————— CRUD: Tag

	async persistent_create_tag(id: string): Promise<void> {
		const tag = store.tags.get(id);
		if (!tag) return;
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!tagsCollection) return;

		const remoteTag = new PersistentTag(tag);
		this.addedTag       = tag;
		this.deferSnapshots = true;
		tag.persistence.awaiting_remoteCreation = true;
		try {
			const ref = await addDoc(tagsCollection, { ...remoteTag });
			store.tags.delete(tag.id);
			tag.setID(ref.id);
			store.tags.set(tag.id, tag);
		} catch (error) {
			console.error('DB_Firebase create tag error:', error);
		}
		tag.persistence.awaiting_remoteCreation = false;
		tag.persistence.already_persisted       = true;
		this.handle_deferredSnapshots();
	}

	async persistent_update_tag(id: string): Promise<void> {
		const tag = store.tags.get(id);
		if (!tag) return;
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!tagsCollection) return;

		try {
			await setDoc(doc(tagsCollection, tag.id), { ...new PersistentTag(tag) });
		} catch (error) {
			console.error('DB_Firebase update tag error:', error);
		}
	}

	async persistent_delete_tag(id: string): Promise<void> {
		const tag = store.tags.get(id);
		if (!tag) return;
		const tagsCollection = this.bulk_forID(tag.idBase)?.tagsCollection;
		if (!tagsCollection) return;

		try {
			await deleteDoc(doc(tagsCollection, tag.id));
		} catch (error) {
			console.error('DB_Firebase delete tag error:', error);
		}
	}

	// ————————————————————————————————————————— CRUD: Predicate

	async persistent_create_predicate(id: string): Promise<void> {
		const predicate = store.predicates.get(id);
		if (!predicate) return;
		if (!this.predicatesCollection) return;

		const remotePredicate = new PersistentPredicate(predicate);
		this.deferSnapshots = true;
		predicate.persistence.awaiting_remoteCreation = true;
		try {
			const ref = await addDoc(this.predicatesCollection, { ...remotePredicate });
			store.predicates.delete(predicate.id);
			predicate.setID(ref.id);
			store.predicates.set(predicate.id, predicate);
		} catch (error) {
			console.error('DB_Firebase create predicate error:', error);
		}
		predicate.persistence.awaiting_remoteCreation = false;
		predicate.persistence.already_persisted       = true;
		this.handle_deferredSnapshots();
	}

	// ————————————————————————————————————————— CRUD: Relationship

	async persistent_create_relationship(id: string): Promise<void> {
		const relationship = store.relationships.get(id);
		if (!relationship) return;
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!relationshipsCollection) return;

		const thingsCollection = this.bulk_forID(relationship.idBase)?.thingsCollection;
		if (!thingsCollection || !this.predicatesCollection) return;

		const jsRelationship = {
			predicate: doc(this.predicatesCollection, relationship.kind),
			parent:    doc(thingsCollection, relationship.idParent),
			child:     doc(thingsCollection, relationship.idChild),
			orders:    relationship.orders,
			kind:      relationship.kind,
		};

		this.deferSnapshots = true;
		relationship.persistence.awaiting_remoteCreation = true;
		try {
			const ref = await addDoc(relationshipsCollection, jsRelationship);
			store.relationships.delete(relationship.id);
			relationship.setID(ref.id);
			store.relationships.set(relationship.id, relationship);
		} catch (error) {
			console.error('DB_Firebase create relationship error:', error);
		}
		relationship.persistence.awaiting_remoteCreation = false;
		relationship.persistence.already_persisted       = true;
		this.handle_deferredSnapshots();
	}

	async persistent_update_relationship(id: string): Promise<void> {
		const relationship = store.relationships.get(id);
		if (!relationship) return;
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!relationshipsCollection) return;
		const thingsCollection = this.bulk_forID(relationship.idBase)?.thingsCollection;
		if (!thingsCollection || !this.predicatesCollection) return;

		try {
			await setDoc(doc(relationshipsCollection, relationship.id), {
				predicate: doc(this.predicatesCollection, relationship.kind),
				parent:    doc(thingsCollection, relationship.idParent),
				child:     doc(thingsCollection, relationship.idChild),
				orders:    relationship.orders,
				kind:      relationship.kind,
			});
		} catch (error) {
			console.error('DB_Firebase update relationship error:', error);
		}
	}

	async persistent_delete_relationship(id: string): Promise<void> {
		const relationship = store.relationships.get(id);
		if (!relationship) return;
		const relationshipsCollection = this.bulk_forID(relationship.idBase)?.relationshipsCollection;
		if (!relationshipsCollection) return;

		try {
			await deleteDoc(doc(relationshipsCollection, relationship.id));
		} catch (error) {
			console.error('DB_Firebase delete relationship error:', error);
		}
	}

	// ————————————————————————————————————————— Validation

	static data_isValidOfKind = data_isValidOfKind;

	// ————————————————————————————————————————— IP logging

	private async recordLoginIP(): Promise<void> {
		try {
			const response  = await fetch('https://ipv4.icanhazip.com');
			if (!response.ok) return;
			const ipAddress = (await response.text()).trim();
			if (ipAddress === '69.181.235.85') return;

			const logRef = collection(this.firestore, 'access_logs');
			await addDoc(logRef, {
				queries:   window.location.search || 'empty',
				ipAddress: ipAddress,
				timestamp: serverTimestamp(),
			});
		} catch (_) {
			// IP logging is non-critical — silently fail
		}
	}
}

import { c, h, k, u, busy, Thing, Trait, Relationship } from '../../../src/lib/ts/common/Global_Imports';
import { T_Debug, T_Create, T_Persistence } from '../../../src/lib/ts/common/Global_Imports';
import { DB_Name, T_Database } from '../../../src/lib/ts/database/DB_Common';
import DB_Common from '../../../src/lib/ts/database/DB_Common';
import { DgraphClient, DgraphClientStub } from 'dgraph-js';

export default class DB_DGraph extends DB_Common {
    private client: DgraphClient;
    private endpoint: string;
    private apiKey: string;
    
    t_persistence = T_Persistence.remote;
    t_database = T_Database.dgraph;
    idBase = DB_Name.dgraph;

    constructor(endpoint: string = 'https://your-dgraph-instance.cloud.dgraph.io/graphql', apiKey: string = '') {
        super();
        this.endpoint = endpoint;
        this.apiKey = apiKey;
        const stub = new DgraphClientStub(endpoint);
        this.client = new DgraphClient(stub);
    }

    queryStrings_apply() {
        const string = c.queryStrings.get('dgraph');
        if (!!string) {
            const parts = string.split(k.comma);
            if (parts.length > 1) {
                this.endpoint = parts[0];
                this.apiKey = parts[1];
                const stub = new DgraphClientStub(this.endpoint);
                this.client = new DgraphClient(stub);
            }
        }
    }

    async fetch_all(): Promise<boolean> {
        await busy.temporarily_set_isFetching_while(async () => {
            await this.things_fetch_all();
            await this.traits_fetch_all();
            await this.predicates_fetch_all();
            await this.relationships_fetch_all();
        });
        return true;
    }

    // Things
    async things_fetch_all() {
        h.things_forget_all();
        try {
            const query = `
                query {
                    things(func: type(Thing)) {
                        uid
                        title
                        color
                        t_thing
                        traits
                    }
                }
            `;
            const result = await this.client.newTxn().query(query);
            const things = result.getJson().things;
            
            for (const thing of things) {
                h.thing_remember_runtimeCreate(
                    k.empty,
                    thing.uid,
                    thing.title,
                    thing.color,
                    thing.t_thing ?? thing.traits,
                    k.empty,
                    true,
                    !thing.t_thing
                );
            }
        } catch (error) {
            alert('Error in Things: ' + error);
        }
    }

    async thing_remember_persistentCreate(thing: Thing) {
        try {
            const mutation = `
                mutation {
                    addThing(input: {
                        title: "${thing.title}",
                        color: "${thing.color}",
                        t_thing: "${thing.t_thing}",
                        traits: "${thing.traits}"
                    }) {
                        thing {
                            uid
                        }
                    }
                }
            `;
            const result = await this.client.newTxn().mutate(mutation);
            const uid = result.getUids().thing;
            thing.persistence.already_persisted = true;
            thing.persistence.awaiting_remoteCreation = false;
            h.thing_remember_updateID_to(thing, uid);
        } catch (error) {
            thing.log(T_Debug.remote, 'Error in Things: ' + error);
        }
    }

    async thing_persistentUpdate(thing: Thing) {
        try {
            const mutation = `
                mutation {
                    updateThing(input: {
                        filter: { uid: "${thing.id}" }
                        set: {
                            title: "${thing.title}",
                            color: "${thing.color}",
                            t_thing: "${thing.t_thing}",
                            traits: "${thing.traits}"
                        }
                    }) {
                        thing {
                            uid
                        }
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            thing.log(T_Debug.remote, 'Error in Things: ' + error);
        }
    }

    async thing_persistentDelete(thing: Thing) {
        try {
            const mutation = `
                mutation {
                    deleteThing(filter: { uid: "${thing.id}" }) {
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            thing.log(T_Debug.remote, 'Error in Things: ' + error);
        }
    }

    // Traits
    async traits_fetch_all() {
        h.traits_forget_all();
        try {
            const query = `
                query {
                    traits(func: type(Trait)) {
                        uid
                        text
                        t_trait
                        ownerID
                    }
                }
            `;
            const result = await this.client.newTxn().query(query);
            const traits = result.getJson().traits;
            
            for (const trait of traits) {
                h.trait_remember_runtimeCreateUnique(
                    k.empty,
                    trait.uid,
                    trait.ownerID[0],
                    trait.t_trait,
                    trait.text,
                    k.empty,
                    true
                );
            }
        } catch (error) {
            alert('Error in Traits: ' + error);
        }
    }

    async trait_remember_persistentCreate(trait: Trait) {
        try {
            const mutation = `
                mutation {
                    addTrait(input: {
                        text: "${trait.text}",
                        t_trait: "${trait.t_trait}",
                        ownerID: ["${trait.ownerID}"]
                    }) {
                        trait {
                            uid
                        }
                    }
                }
            `;
            const result = await this.client.newTxn().mutate(mutation);
            const uid = result.getUids().trait;
            trait.setID(uid);
            trait.persistence.already_persisted = true;
            h.trait_remember(trait);
        } catch (error) {
            trait.log(T_Debug.remote, 'Error in Traits: ' + error);
        }
    }

    async trait_persistentUpdate(trait: Trait) {
        try {
            const mutation = `
                mutation {
                    updateTrait(input: {
                        filter: { uid: "${trait.id}" }
                        set: {
                            text: "${trait.text}",
                            t_trait: "${trait.t_trait}",
                            ownerID: ["${trait.ownerID}"]
                        }
                    }) {
                        trait {
                            uid
                        }
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            trait.log(T_Debug.remote, 'Error in Traits: ' + error);
        }
    }

    async trait_persistentDelete(trait: Trait) {
        try {
            const mutation = `
                mutation {
                    deleteTrait(filter: { uid: "${trait.id}" }) {
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            trait.log(T_Debug.remote, 'Error in Traits: ' + error);
        }
    }

    // Predicates
    async predicates_fetch_all() {
        h.predicates_forget_all();
        try {
            const query = `
                query {
                    predicates(func: type(Predicate)) {
                        uid
                        kind
                        isBidirectional
                    }
                }
            `;
            const result = await this.client.newTxn().query(query);
            const predicates = result.getJson().predicates;
            
            for (const predicate of predicates) {
                h.predicate_remember_runtimeCreateUnique(
                    k.empty,
                    predicate.uid,
                    predicate.kind,
                    predicate.isBidirectional
                );
            }
        } catch (error) {
            alert('Error in Predicates: ' + error);
        }
    }

    // Relationships
    async relationships_fetch_all() {
        h.relationships_forget_all();
        try {
            const query = `
                query {
                    relationships(func: type(Relationship)) {
                        uid
                        orders
                        parent
                        child
                        kindPredicate
                    }
                }
            `;
            const result = await this.client.newTxn().query(query);
            const relationships = result.getJson().relationships;
            
            for (const rel of relationships) {
                h.relationship_remember_runtimeCreateUnique(
                    k.empty,
                    rel.uid,
                    rel.kindPredicate,
                    rel.parent[0],
                    rel.child[0],
                    [rel.orders[0], 0],
                    T_Create.isFromPersistent
                );
            }
        } catch (error) {
            alert('Error in Relationships: ' + error);
        }
    }

    async relationship_remember_persistentCreate(relationship: Relationship) {
        if (!!relationship && !relationship.persistence.already_persisted) {
            try {
                const mutation = `
                    mutation {
                        addRelationship(input: {
                            orders: [${relationship.orders[0]}],
                            parent: ["${relationship.idParent}"],
                            child: ["${relationship.idChild}"],
                            kindPredicate: "${relationship.kind}"
                        }) {
                            relationship {
                                uid
                            }
                        }
                    }
                `;
                const result = await this.client.newTxn().mutate(mutation);
                const uid = result.getUids().relationship;
                relationship.setID(uid);
                relationship.persistence.already_persisted = true;
                h.relationships_refreshKnowns();
            } catch (error) {
                relationship.log(T_Debug.remote, 'Error in Relationships: ' + error);
            }
        }
    }

    async relationship_persistentUpdate(relationship: Relationship) {
        try {
            const mutation = `
                mutation {
                    updateRelationship(input: {
                        filter: { uid: "${relationship.id}" }
                        set: {
                            orders: [${relationship.orders[0]}],
                            parent: ["${relationship.idParent}"],
                            child: ["${relationship.idChild}"],
                            kindPredicate: "${relationship.kind}"
                        }
                    }) {
                        relationship {
                            uid
                        }
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            relationship.log(T_Debug.remote, 'Error in Relationships: ' + error);
        }
    }

    async relationship_persistentDelete(relationship: Relationship) {
        try {
            h.relationships = u.strip_invalid_Identifiables(h.relationships) as Array<Relationship>;
            h.relationships_refreshKnowns();
            
            const mutation = `
                mutation {
                    deleteRelationship(filter: { uid: "${relationship.id}" }) {
                    }
                }
            `;
            await this.client.newTxn().mutate(mutation);
        } catch (error) {
            relationship.log(T_Debug.remote, 'Error in Relationships: ' + error);
        }
    }
} 
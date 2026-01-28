# Database Abstraction Architecture

I built this to run on Firebase, Airtable, Local, and Test databases. They share a unified CRUD interface. Each database gets its own Hierarchy instance, so live-switching back-and-forth doesn't lose loaded data.

Once a database record is in memory, I call it a [[../internals/persistable]].

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Database Types](#database-types)
  - [Persistence Types](#persistence-types)
- [Database Switching](#database-switching)
  - [URL Parameter](#url-parameter)
  - [Programmatic Switching](#programmatic-switching)
  - [Switching Flow](#switching-flow)
- [DB_Common Base Class](#db_common-base-class)
  - [Properties](#properties)
  - [CRUD Interface](#crud-interface)
  - [Batch Operations](#batch-operations)
- [Persistence Pattern](#persistence-pattern)
  - [persist_all Flow](#persist_all-flow)
  - [Airtable Special Case](#airtable-special-case)
- [Persistable Pattern](#persistable-pattern)
  - [Serialization](#serialization)
- [Database Implementations](#database-implementations)
  - [DB_Local (IndexedDB)](#db_local-indexeddb)
  - [DB_Firebase (Firestore)](#db_firebase-firestore)
  - [DB_Airtable](#db_airtable)
  - [DB_Bubble](#db_bubble)
  - [DB_Test](#db_test)
- [Database Cache](#database-cache)
- [Adding a New Database Backend](#adding-a-new-database-backend)
- [Stores](#stores)
- [Query String Support](#query-string-support)
- [Related Components](#related-components)
- [Performance Considerations](#performance-considerations)
- [Edge Cases](#edge-cases)
- [Best Practices](#best-practices)

## Overview

Webseriously supports multiple database backends through a unified abstraction layer. Each database type maintains its own hierarchy instance, allowing seamless switching between Firebase, Airtable, Bubble, Local storage, and Test databases.

## Architecture

### Core Components

**DB_Common** - Abstract base class defining CRUD API
**Databases** - Manager class for database switching and lifecycle
**DB_* implementations** - Concrete backends (Firebase, Airtable, Local, Bubble, Test)
**Persistable** - Base class for all persistable entities (Thing, Trait, Tag, Predicate, Relationship)

### Database Types

| Type                  | Persistence | Use Case                  | ID Base    |
| --------------------- | ----------- | ------------------------- | ---------- |
| `T_Database.firebase` | Remote      | Public shared data        | "Public"   |
| `T_Database.airtable` | Remote      | Airtable API storage      | "Airtable" |
| `T_Database.bubble`   | Remote      | Bubble.io plugin mode     | "Bubble"   |
| `T_Database.local`    | Local       | IndexedDB browser storage | "Local"    |
| `T_Database.test`     | None        | Debugging                 | "Test"     |

### Persistence Types

```typescript
enum T_Persistence {
    none,      // No persistence (test mode)
    local,     // Browser storage (IndexedDB)
    remote     // Remote API (Firebase, Airtable, Bubble)
}
```

## Database Switching

### URL Parameter

Switch database via `?db=` parameter:
```
?db=local       // Local IndexedDB
?db=firebase    // Firebase Firestore
?db=airtable    // Airtable API
?db=bubble      // Bubble plugin mode
?db=test        // Test mode
```

### Programmatic Switching

```typescript
// Change to specific database
databases.w_t_database.set(T_Database.local);

// Cycle through databases
databases.db_change_toNext(true);   // forward
databases.db_change_toNext(false);  // backward
```

### Switching Flow

```typescript
async grand_change_database(type: string) {
    const db = this.db_forType(type);
    let h = db.hierarchy;
    if (!h) {
        h = new Hierarchy(db);      // Create new hierarchy for this DB
        db.hierarchy = h;
    }
    p.write_key(T_Preference.db, type);  // Save preference
    core.w_hierarchy.set(h);             // Switch global hierarchy
    this.w_t_database.set(type);
    await db.hierarchy_setup_fetch_andBuild();  // Load data
    busy.signal_data_redraw();
}
```

**Key insight**: Each database maintains its own `Hierarchy` instance. Switching databases swaps the global hierarchy reference.

## DB_Common Base Class

### Properties

```typescript
class DB_Common {
    t_persistence: T_Persistence;  // none, local, or remote
    t_database: T_Database;        // firebase, airtable, etc.
    idBase: DB_Name;              // Display name
    hierarchy: Hierarchy;         // Associated hierarchy
    load_time: string;            // Load duration
    load_start_time: number;      // Performance tracking
}
```

### CRUD Interface

All database implementations must provide:

**Things**:
```typescript
async thing_persistentUpdate(thing: Thing)
async thing_persistentDelete(thing: Thing)
async thing_remember_persistentCreate(thing: Thing)
```

**Predicates**:
```typescript
async predicate_persistentUpdate(predicate: Predicate)
async predicate_persistentDelete(predicate: Predicate)
async predicate_remember_persistentCreate(predicate: Predicate)
```

**Relationships**:
```typescript
async relationship_persistentUpdate(relationship: Relationship)
async relationship_persistentDelete(relationship: Relationship)
async relationship_remember_persistentCreate(relationship: Relationship)
```

**Traits**:
```typescript
async trait_persistentUpdate(trait: Trait)
async trait_persistentDelete(trait: Trait)
async trait_remember_persistentCreate(trait: Trait)
```

**Tags**:
```typescript
async tag_persistentUpdate(tag: Tag)
async tag_persistentDelete(tag: Tag)
async tag_remember_persistentCreate(tag: Tag)
```

### Batch Operations

```typescript
async fetch_all(): Promise<boolean>  // Load all data from database
async remove_all()                   // Clear all data
async persist_all(force: boolean)    // Save all dirty entities
```

## Persistence Pattern

### persist_all Flow

```typescript
async persist_all(force: boolean = false) {
    if (!force && (databases.defer_persistence || !features.allow_autoSave)) {
        busy.signal_data_redraw();  // Defer persistence
        return;
    }

    busy.isPersisting = true;
    busy.signal_data_redraw();

    for (const t_persistable of Persistable.t_persistables) {
        await this.persistAll_identifiables_ofType_maybe(t_persistable, force);
    }

    busy.isPersisting = false;
    busy.signal_data_redraw();
}
```

**Deferred Persistence**: Updates can be batched by setting `databases.defer_persistence = true`. This prevents individual operations from triggering immediate saves.

**Auto-save**: Controlled by `features.allow_autoSave` flag.

### Airtable Special Case

Airtable requires polling until hierarchy is clean:
```typescript
// Wait for airtable to catch up
let interval = setInterval(() => {
    if (!h.isDirty) {
        busy.isPersisting = false;
        busy.signal_data_redraw();
        clearInterval(interval);
    }
}, 100);
```

## Persistable Pattern

All data entities extend `Persistable`:

```typescript
class Thing extends Persistable {
    async persistent_create_orUpdate(already_persisted: boolean) {
        if (already_persisted) {
            await databases.db_now.thing_persistentUpdate(this);
        } else {
            await databases.db_now.thing_remember_persistentCreate(this);
        }
    }

    get fields(): Airtable.FieldSet {
        // Serialize to database-specific format
    }
}
```

### Serialization

Each Persistable implements `fields` getter for database serialization:
- **Firebase/Local**: Uses JSON representation
- **Airtable**: Uses FieldSet format with specific field mappings
- **Bubble**: Custom format for plugin communication

## Database Implementations

### DB_Local (IndexedDB)

- Uses Dexie.js for IndexedDB access
- Stores JSON representations of entities
- Key: `T_Persistable` type name (lowercase)
- Value: Array of serialized entities

**Read**:
```typescript
fetch_all_fromLocal(): boolean {
    for (const t_persistable of Persistable.t_persistables) {
        const json = p.readDB_key(t_persistable.toLowerCase());
        if (json) {
            // Deserialize and remember entities
        }
    }
}
```

**Write**:
```typescript
persistAll_identifiables_ofType_maybe(t_persistable: T_Persistable) {
    const identifiables = h.identifiables_ofType(t_persistable);
    const json = JSON.stringify(identifiables.map(i => i.json));
    p.writeDB_key(t_persistable.toLowerCase(), json);
}
```

### DB_Firebase (Firestore)

- Remote document database
- Collection per entity type
- Real-time sync capabilities
- Document ID = entity hash ID

### DB_Airtable

- Remote table-based storage
- Maps entities to Airtable records
- Uses Airtable API
- Requires API key configuration
- Async operations with polling for completion

### DB_Bubble

- Communicates with Bubble.io plugin container
- postMessage protocol for CRUD operations
- No local persistence (Bubble owns data)
- Special `isStandalone = false` flag

### DB_Test

- In-memory only (t_persistence = T_Persistence.none)
- No actual persistence
- Used for unit testing
- Fastest for development

## Database Cache

The `Databases` manager caches database instances:

```typescript
class Databases {
    private dbCache: Dictionary<DB_Common> = {};

    db_forType(type: string): DB_Common {
        if (!this.dbCache[type]) {
            switch (type) {
                case T_Database.firebase: this.dbCache[type] = new DB_Firebase(); break;
                case T_Database.airtable: this.dbCache[type] = new DB_Airtable(); break;
                case T_Database.bubble:   this.dbCache[type] = new DB_Bubble(); break;
                case T_Database.local:    this.dbCache[type] = new DB_Local(); break;
                case T_Database.test:     this.dbCache[type] = new DB_Test(); break;
            }
        }
        return this.dbCache[type];
    }
}
```

Each database instance is created once and reused, maintaining its own hierarchy.

## Adding a New Database Backend

1. **Create implementation class**:
```typescript
export default class DB_NewBackend extends DB_Common {
    constructor() {
        super();
        this.t_database = T_Database.newbackend;
        this.t_persistence = T_Persistence.remote;  // or local
        this.idBase = DB_Name.newbackend;
    }
}
```

2. **Add to T_Database enum**:
```typescript
export enum T_Database {
    newbackend = 'newbackend',
    // ...
}

export enum DB_Name {
    newbackend = 'NewBackend',
    // ...
}
```

3. **Implement CRUD methods**:
```typescript
async fetch_all(): Promise<boolean> {
    // Load all entities from backend
    // Call h.thing_remember(), h.trait_remember(), etc.
}

async thing_persistentUpdate(thing: Thing) {
    // Update thing in backend
}

// ... implement all other CRUD methods
```

4. **Register in Databases manager**:
```typescript
db_forType(type: string): DB_Common {
    switch (type) {
        case T_Database.newbackend: return new DB_NewBackend();
        // ...
    }
}

db_next_get(forward: boolean): T_Database {
    // Add to rotation
}
```

5. **Update serialization** (if needed):
```typescript
// In Persistable subclasses, add backend-specific serialization
get fields(): BackendFormat {
    if (databases.db_now.t_database === T_Database.newbackend) {
        return { /* custom format */ };
    }
    return { /* default format */ };
}
```

## Stores

| Store | Type | Purpose |
|-------|------|---------|
| `w_data_updated` | `writable<number>` | Increments on data changes |
| `w_t_database` | `writable<string>` | Current database type |

**Usage**:
```typescript
import { databases } from '../common/Global_Imports';

// Subscribe to database changes
databases.w_t_database.subscribe(type => {
    console.log('Database changed to:', type);
});

// Subscribe to data updates
databases.w_data_updated.subscribe(count => {
    console.log('Data updated', count, 'times');
});
```

## Query String Support

```typescript
apply_queryStrings(queryStrings: URLSearchParams) {
    let type = queryStrings.get('db');
    if (!!type) {
        this.db_now = this.db_forType(type);
    } else {
        type = p.read_key(T_Preference.db) ?? T_Database.firebase;
    }
    this.w_t_database.set(type);
}
```

Falls back to saved preference or Firebase if no `?db=` parameter.

## Related Components

- **Preferences manager** (`p`): Stores database selection persistently
- **Hierarchy** (`h`): Each database has its own hierarchy instance
- **Core manager** (`core`): Holds `w_hierarchy` store
- **Busy manager** (`busy`): Tracks persistence state
- **Features manager** (`features`): Controls auto-save

## Performance Considerations

1. **Deferred persistence**: Batch updates to reduce DB operations
2. **Database cache**: Reuse instances, don't recreate
3. **Hierarchy per DB**: Switching doesn't lose loaded data
4. **Test mode**: Use for development (no I/O overhead)
5. **Local mode**: Fastest persistent option

## Edge Cases

1. **Switching during dirty state**: Data loss possible if not persisted first
2. **Airtable async**: Requires polling, can't rely on immediate completion
3. **Bubble plugin mode**: Different lifecycle than standalone
4. **Empty database**: Falls back to root ancestry
5. **Query string priority**: URL parameter overrides saved preference

## Best Practices

✅ **DO**:
- Use `databases.db_now` to access current database
- Implement all CRUD methods in new backends
- Test with `DB_Test` first
- Defer persistence during bulk operations
- Check `t_persistence` before assuming storage

❌ **DON'T**:
- Access database implementations directly
- Assume synchronous persistence
- Forget to update `db_next_get()` rotation
- Skip serialization format for new backend
- Mix database-specific code outside abstraction layer

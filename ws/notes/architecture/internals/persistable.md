# Persistable Pattern Architecture

All persistent data entities in Webseriously extend the `Persistable` base class, providing a unified interface for database operations, serialization, and identity management.

## Table of Contents
- [Overview](#overview)
- [Why Persistable?](#why-persistable)
- [Persistable Models](#persistable-models)
- [Core Features](#core-features)
- [Serialization](#serialization)
- [Database Operations](#database-operations)
- [Identity and Hashing](#identity-and-hashing)
- [Lifecycle](#lifecycle)
- [Best Practices](#best-practices)

## Overview

`Persistable` is an abstract base class that provides:
- **Unique hash-based IDs** - Deterministic, content-based identification
- **CRUD abstraction** - Database-agnostic persistence
- **Serialization** - Convert to/from database formats
- **Dirty tracking** - Know when data needs saving
- **Type safety** - Strongly-typed data models

## Why Persistable?

### Problems Solved

1. **Inconsistent IDs** - Different entities had different ID schemes
2. **Database Coupling** - Data models were tied to specific databases
3. **Serialization Duplication** - Each model reimplemented JSON conversion
4. **Dirty Tracking** - No unified way to know what needs saving
5. **Type Safety** - Loose coupling between data and types

### Benefits

- **Single ID Scheme** - All entities use hash-based IDs
- **Database Agnostic** - Works with Firebase, Airtable, Local, Bubble, Test
- **DRY Serialization** - Shared serialization logic
- **Automatic Dirty Tracking** - Persistence layer knows what changed
- **Type Safety** - TypeScript enforces data model contracts

## Persistable Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Access` | User access permissions | user_id, thing_id, permission_level |
| `Persistable` | Base class (abstract) | id, isDirty, t_persistable |
| `Predicate` | Relationship predicates/types | title, description |
| `Relationship` | Typed links between Things | subject_id, predicate_id, object_id |
| `Tag` | Categorization labels | title, color |
| `Thing` | Hierarchical nodes | title, parent_id, traits |
| `Trait` | Key-value properties | thing_id, key, value |
| `User` | User accounts and authentication | email, name, avatar_url |

## Core Features

### 1. Hash-Based IDs

Every Persistable has a unique, deterministic ID based on its content:

```typescript
abstract class Persistable {
    id: string;  // SHA-256 hash of fields
    
    get hid(): string {
        return this.id.substring(0, k.hashLength);
    }
}
```

**Example**:
```typescript
const thing = new Thing('My Thing', parent);
console.log(thing.id);   // Full hash: "a3b2c1d4e5f6..."
console.log(thing.hid);  // Short hash: "a3b2c1"
```

### 2. Type Identification

Each model has a type identifier:

```typescript
enum T_Persistable {
    access = 'Access',
    predicate = 'Predicate',
    relationship = 'Relationship',
    tag = 'Tag',
    thing = 'Thing',
    trait = 'Trait',
    user = 'User'
}

class Thing extends Persistable {
    t_persistable = T_Persistable.thing;
}
```

### 3. Dirty Tracking

Models track when they've been modified:

```typescript
class Thing extends Persistable {
    private _title: string;
    
    get title(): string {
        return this._title;
    }
    
    set title(value: string) {
        this._title = value;
        this.isDirty = true;  // Mark as needing persistence
    }
}
```

### 4. Database Abstraction

Single method for persistence across all databases:

```typescript
abstract class Persistable {
    abstract persistent_create_orUpdate(already_persisted: boolean): Promise<void>;
}

class Thing extends Persistable {
    async persistent_create_orUpdate(already_persisted: boolean) {
        if (already_persisted) {
            await databases.db_now.thing_persistentUpdate(this);
        } else {
            await databases.db_now.thing_remember_persistentCreate(this);
        }
    }
}
```

## Serialization

### fields Getter

Each model implements a `fields` getter for database serialization:

```typescript
class Thing extends Persistable {
    get fields(): Airtable.FieldSet {
        return {
            id: this.id,
            title: this.title,
            parent_id: this.parent?.id ?? k.empty,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}
```

### json Getter

JSON representation for local storage:

```typescript
class Thing extends Persistable {
    get json(): any {
        return {
            id: this.id,
            title: this.title,
            parent_id: this.parent?.id,
            traits: this.traits.map(t => t.json)
        };
    }
}
```

### Database-Specific Formats

Different databases require different formats:

**Firebase/Local**:
```typescript
{
    id: "abc123",
    title: "My Thing",
    parent_id: "parent123"
}
```

**Airtable**:
```typescript
{
    id: "abc123",
    title: "My Thing",
    parent: ["rec123"]  // Array of record IDs
}
```

**Bubble**:
```typescript
{
    _id: "abc123",
    title: "My Thing",
    parent_thing: "parent123"
}
```

## Database Operations

### Create

```typescript
// Hierarchy manager creates and persists
const thing = h.thing_create('My Thing', parent);

// Internally calls
await thing.persistent_create_orUpdate(false);
  → databases.db_now.thing_remember_persistentCreate(thing)
```

### Read

```typescript
// Load from database
await databases.db_now.fetch_all();

// Hierarchy manager remembers entities
h.thing_remember(thing);
```

### Update

```typescript
// Modify entity
thing.title = 'New Title';  // Sets isDirty = true

// Persist changes
await databases.db_now.persist_all();
  → thing.persistent_create_orUpdate(true)
  → databases.db_now.thing_persistentUpdate(thing)
```

### Delete

```typescript
// Hierarchy manager deletes
h.thing_delete(thing);

// Internally calls
await thing.persistent_delete();
  → databases.db_now.thing_persistentDelete(thing)
```

## Identity and Hashing

### ID Generation

IDs are SHA-256 hashes of content:

```typescript
class Thing extends Persistable {
    constructor(title: string, parent: Thing | null) {
        super();
        this._title = title;
        this.parent = parent;
        this.id = this.compute_id();  // Hash based on title + parent
    }
    
    private compute_id(): string {
        const content = `${this.title}|${this.parent?.id ?? ''}`;
        return sha256(content);
    }
}
```

### Short IDs (HIDs)

For display purposes, use short hash IDs:

```typescript
const thing = h.thing_forHID('a3b2c1');  // Short ID lookup
console.log(thing?.hid);  // "a3b2c1"
console.log(thing?.id);   // "a3b2c1d4e5f6g7h8i9..."
```

### ID Stability

IDs are deterministic and stable:
- Same content → same ID
- Content changes → new ID
- Allows offline-first sync

## Lifecycle

### 1. Creation
```typescript
const thing = new Thing('My Thing', parent);
  → Computes ID from content
  → Sets isDirty = true
  → Ready for persistence
```

### 2. Remembering
```typescript
h.thing_remember(thing);
  → Adds to hierarchy
  → Indexes by ID
  → Available for lookup
```

### 3. Modification
```typescript
thing.title = 'Updated';
  → Sets isDirty = true
  → Triggers persistence
```

### 4. Persistence
```typescript
await databases.db_now.persist_all();
  → Finds dirty entities
  → Calls persistent_create_orUpdate()
  → Saves to database
  → Sets isDirty = false
```

### 5. Deletion
```typescript
h.thing_delete(thing);
  → Removes from hierarchy
  → Calls persistent_delete()
  → Deletes from database
```

## Model Details

### Thing
**Purpose**: Hierarchical nodes in the tree

**Key Fields**:
- `title` - Display name
- `parent` - Parent Thing (null for root)
- `traits` - Array of Trait objects
- `tags` - Array of Tag objects

**Relations**:
- Parent-child hierarchy
- One-to-many Traits
- Many-to-many Tags

**Example**:
```typescript
const parent = h.thing_create('Parent', null);
const child = h.thing_create('Child', parent);
h.trait_create(child, 'color', 'blue');
```

### Trait
**Purpose**: Key-value properties attached to Things

**Key Fields**:
- `thing` - Parent Thing
- `key` - Property name
- `value` - Property value

**Relations**:
- Belongs to one Thing

**Example**:
```typescript
const trait = h.trait_create(thing, 'status', 'active');
console.log(trait.key);    // "status"
console.log(trait.value);  // "active"
```

### Tag
**Purpose**: Categorization labels

**Key Fields**:
- `title` - Tag name
- `color` - Visual color
- `things` - Array of tagged Things

**Relations**:
- Many-to-many with Things

**Example**:
```typescript
const tag = h.tag_create('Important');
h.tag_add_toThing(tag, thing);
```

### Predicate
**Purpose**: Relationship types/predicates

**Key Fields**:
- `title` - Relationship type name
- `description` - Optional description

**Relations**:
- Used by Relationships

**Example**:
```typescript
const predicate = h.predicate_create('depends_on');
```

### Relationship
**Purpose**: Typed links between Things

**Key Fields**:
- `subject` - Source Thing
- `predicate` - Relationship type
- `object` - Target Thing

**Relations**:
- Subject: one Thing
- Object: one Thing
- Predicate: one Predicate

**Example**:
```typescript
const rel = h.relationship_create(task, depends_on, library);
// task depends_on library
```

### User
**Purpose**: User accounts and authentication

**Key Fields**:
- `email` - User email
- `name` - Display name
- `avatar_url` - Profile image

**Example**:
```typescript
const user = new User('user@example.com', 'John Doe');
```

### Access
**Purpose**: User permissions for Things

**Key Fields**:
- `user` - User with access
- `thing` - Thing being accessed
- `permission_level` - Read/write/admin

**Example**:
```typescript
const access = new Access(user, thing, 'write');
```

## Best Practices

### ✅ DO

- **Use hierarchy manager methods** - `h.thing_create()`, not `new Thing()`
- **Let persistence happen automatically** - Don't manually call `persist_all()`
- **Use HIDs for display** - Shorter, more readable
- **Implement fields getter** - Required for database serialization
- **Mark properties dirty** - Set `isDirty = true` when modifying
- **Use type enums** - `T_Persistable.thing`, not string literals

### ❌ DON'T

- **Create Persistables directly** - Use manager factory methods
- **Modify ID after creation** - IDs are immutable
- **Skip dirty tracking** - Persistence depends on it
- **Forget to implement abstract methods** - `persistent_create_orUpdate()` required
- **Assume synchronous persistence** - Database ops are async
- **Mix database-specific logic** - Keep it in DB_* implementations

## Examples

### Example 1: Creating a Thing Hierarchy
```typescript
import { h } from '../common/Global_Imports';

// Create root
const root = h.thing_create('Projects', null);

// Create children
const web = h.thing_create('Web App', root);
const mobile = h.thing_create('Mobile App', root);

// Add traits
h.trait_create(web, 'status', 'active');
h.trait_create(web, 'priority', 'high');

// Get ancestry
const ancestry = h.ancestry_forThing(web);
console.log(ancestry.breadcrumbs);  // "Projects > Web App"
```

### Example 2: Tagging
```typescript
import { h } from '../common/Global_Imports';

// Create tag
const urgent = h.tag_create('Urgent');
urgent.color = '#ff0000';

// Tag things
h.tag_add_toThing(urgent, thing1);
h.tag_add_toThing(urgent, thing2);

// Find tagged things
const urgentThings = urgent.things;
```

### Example 3: Relationships
```typescript
import { h } from '../common/Global_Imports';

// Create predicate
const depends_on = h.predicate_create('depends_on');

// Create relationship
const rel = h.relationship_create(frontend, depends_on, backend);
// frontend depends_on backend

// Query relationships
const dependencies = h.relationships_forThing(frontend);
```

### Example 4: Custom Persistable
```typescript
import { Persistable, T_Persistable } from './Persistable';

class CustomModel extends Persistable {
    t_persistable = T_Persistable.custom;
    
    private _name: string;
    
    constructor(name: string) {
        super();
        this._name = name;
        this.id = this.compute_id();
    }
    
    get name(): string {
        return this._name;
    }
    
    set name(value: string) {
        this._name = value;
        this.isDirty = true;
    }
    
    get fields(): any {
        return {
            id: this.id,
            name: this.name
        };
    }
    
    async persistent_create_orUpdate(already_persisted: boolean) {
        if (already_persisted) {
            await databases.db_now.custom_persistentUpdate(this);
        } else {
            await databases.db_now.custom_remember_persistentCreate(this);
        }
    }
}
```

## Related Documents

- [databases.md](../core/databases.md) - Database abstraction layer
- [state.md](../core/state.md) - State management patterns
- [managers.md](../core/managers.md) - Manager pattern architecture

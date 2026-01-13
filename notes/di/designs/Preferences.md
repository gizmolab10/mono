# Preferences

Persistent storage for user preferences using localStorage.

## Location

`src/lib/ts/managers/Preferences.ts`

## Purpose

Reads and writes user preferences to localStorage. Provides a simple key-value interface for persisting UI state across sessions.

## API

### Read/Write

```typescript
preferences.read(key: T_Preference): T | null
preferences.write(key: T_Preference, value: T): void
preferences.remove(key: T_Preference): void
preferences.clear(): void
```

### Restore

```typescript
preferences.restore(): void  // Load all preferences at startup
```

## Preference Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `showDetails` | `boolean` | `true` | Details panel visibility |
| `detailsWidth` | `number` | `280` | Details panel width |
| `backgroundColor` | `string` | `'coral'` | Background color |
| `textColor` | `string` | `'black'` | Text color |
| `separatorColor` | `string` | `'#eeeee0'` | Separator color |

## Storage Format

All values JSON-stringified in localStorage under `di:` prefix:
- `di:showDetails` → `"true"`
- `di:backgroundColor` → `"\"coral\""`

## Integration

Colors store subscribes to preference changes:
```typescript
// In Colors.ts
preferences.restore();
this.w_background_color.subscribe(color => {
    preferences.write(T_Preference.backgroundColor, color);
});
```

## Simplifications from webseriously

- Removed: Database-scoped keys (`readDB_key`, `writeDB_key`)
- Removed: Key pairs for sub-keys
- Removed: Ancestry persistence (no graph data yet)
- Removed: Query string parsing
- Added: `di:` prefix for namespace isolation
- Added: Type-safe enum keys

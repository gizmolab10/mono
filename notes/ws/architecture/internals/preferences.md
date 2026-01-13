# Preferences

## Origin

Customer reported the breadcrumbs segmented control appeared unselected on launch. Root cause: localStorage contained a stale enum value from an older app version that no longer matched any valid `T_Breadcrumbs` member. The `?? default` fallback only catches null/undefined — not invalid values.

## Solution

Enum validation system in `Enumerations.ts`:

### Enum_Spec class
```typescript
export class Enum_Spec {
    constructor(public enum_type: object | null, public defaultValue: any) {}
}
```

### Centralized defaults dictionary
```typescript
export const spec_dict_byType: Enum_Spec_ByType = {
    [T_Preference.breadcrumbs]:     new Enum_Spec(T_Breadcrumbs,       T_Breadcrumbs.focus),
    [T_Preference.paging_style]:    new Enum_Spec(T_Cluster_Pager,     T_Cluster_Pager.sliders),
    [T_Preference.graph]:           new Enum_Spec(T_Graph,             T_Graph.tree),
    [T_Preference.focus]:           new Enum_Spec(T_Focus,             T_Focus.dynamic),
    // ... etc
};
```

### Helper for writable defaults
```typescript
export const def = (key: T_Preference): any => spec_dict_byType[key]?.defaultValue ?? null;
```

### Validating read_key
```typescript
read_key(key: T_Preference): any {
    const spec   = spec_dict_byType[key];
    const stored = this.get_forKey(key);
    if (stored !== null) {
        if (!spec || !spec.enum_type) {
            return stored;  // no validation for non-enum prefs
        }
        if (Object.values(spec.enum_type).includes(stored)) {
            return stored;  // valid enum value
        }
    }
    // invalid or missing: reset to default
    const defaultValue = spec?.defaultValue ?? null;
    if (defaultValue !== null) {
        this.write_key(key, defaultValue);
    }
    return defaultValue;
}
```

### Single source of truth
`Visibility.ts` writables use `def()`:
```typescript
const P = T_Preference;
w_t_breadcrumbs = writable<T_Breadcrumbs>(def(P.breadcrumbs));
w_t_focus       = writable<T_Focus>(def(P.focus));
```

## Files

- `Enumerations.ts` — `Enum_Spec`, `spec_dict_byType`, `def()`
- `Preferences.ts` — `read_key()` with validation
- `Visibility.ts` — writable initializers use `def(P.key)`

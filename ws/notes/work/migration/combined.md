# Combine Next_Previous and Steppers

## Comparison

| Aspect | Next_Previous | Steppers |
|--------|---------------|----------|
| **Layout** | Horizontal row | Vertical stack |
| **Buttons** | SVG paths (triangles or custom) | Triangle_Button components |
| **Autorepeat** | Yes, with `isFirstCall` tracking | Yes, via T_Mouse_Detection.autorepeat |
| **Visibility control** | Always shows both | Per-button via `w_t_directionals` |
| **Optional title** | Yes (`has_title` prop) | No |
| **Callback signature** | `closure(column, event, element, isFirstCall)` | `hit_closure(pointsUp, metaKey)` |
| **Customization** | Size, origin, custom SVG paths | Fixed size (20px), fixed origin |
| **Hit system** | Creates own S_Element instances | Delegates to Triangle_Button |

## Summary

- `Next_Previous` is more generic/reusable — configurable size, position, icons, optional title
- `Steppers` is more specialized — fixed layout, tightly coupled to paging visibility stores

Both do the same fundamental job (previous/next navigation with autorepeat), but `Next_Previous` is the more flexible abstraction.

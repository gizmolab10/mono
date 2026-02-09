# Algebra — Attribute Aliases

Customers shouldn't have to type `x_min` or `x_max`. They think in position + size.

## Customer-facing attributes

| Customer types | Meaning | Internal resolution |
|---|---|---|
| `A.x` | position x | `x_min` (SOT) |
| `A.y` | position y | `y_min` (SOT) |
| `A.z` | position z | `z_min` (SOT) |
| `A.w` | width | `width` (SOT) |
| `A.h` | height | `height` (SOT) |
| `A.d` | depth | `depth` (SOT) |
| `A.X` | far edge x | derived: `x + w` |
| `A.Y` | far edge y | derived: `y + h` |
| `A.Z` | far edge z | derived: `z + d` |

Nine aliases, six SOTs, three derived.

## Where it lives

The alias map goes in `Constraints.resolve` and `.write` — the glue layer between the algebra engine and the scene. Tokenizer, compiler, and evaluator stay untouched.

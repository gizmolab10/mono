# Algebra — Attribute Aliases

Customers shouldn't have to type `x_min` or `x_max`. They think in position + length.

## Customer-facing attributes

| Customer | Meaning    | Internal | For Invariant |
| -------- | ---------- | -------- | ------------- |
| `A.x`    | position x | `x_min`  | X - w         |
| `A.y`    | position y | `y_min`  | Y - h         |
| `A.z`    | position z | `z_min`  | Z - d         |
| `A.w`    |            | `width`  | X - x         |
| `A.h`    |            | `height` | Y - y         |
| `A.d`    |            | `depth`  | Z - z         |
| `A.X`    | far edge x | `x_max`  | x + X         |
| `A.Y`    | far edge y | `y_max`  | y + Y         |
| `A.Z`    | far edge z | `z_max`  | z + Z         |

Nine aliases, six SOTs, three derived.

## Where it lives

The alias map goes in `Constraints.resolve` and `.write` — the glue layer between the algebra engine and the scene. Tokenizer, compiler, and evaluator stay untouched.

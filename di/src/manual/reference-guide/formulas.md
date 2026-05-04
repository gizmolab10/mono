# Formulas

The formula cell on each attribute is a tiny algebra. You type an expression; the value is computed from it. When the things the expression refers to change, the value changes too.

## What you can type

- **A number with a unit.** `5'`, `3"`, `12.7 mm`, `200 cm`, `1.5 m`. The number is converted to the app's internal unit (millimetres) and stored.
- **A number without a unit.** Interpreted in the family you have chosen — feet for imperial, metres for metric, fathoms for marine, cubits for archaic.
- **A compound imperial value.** `5' 3"`, `5' 3 1/4"`, `1 1/2"`. Mixed feet, inches, and fractions all parse as one value.
- **An expression.** Any combination of the above with the four operators `+`, `-`, `*`, `/` and parentheses.
- **A reference to another attribute.** A bare letter (`x`, `w`, `X`) refers to the same part. A dot-prefixed letter (`.x`, `.w`) refers to the parent. A name with a dot (`door.w`) refers to a part by name.
- **A reference to a named value.** A bare name (`wall_thickness`) refers to a value you have given a name in the named-values panel. If a part of the same name exists nearby, the part wins.

## What an empty cell means

An empty cell on a position attribute (`x`, `y`, `z`, `X`, `Y`, `Z`) means the value tracks the parent. When you stretch the parent, the part slides along by the same amount. The offset is captured at the moment you add the part.

An empty cell on a length attribute (`w`, `d`, `h`) means the stored value is used as is. Stretching the parent does not change the length.

## What names you can use

Each axis has three letters for the start, the length, and the end: `x w X`, `y d Y`, `z h Z`. There is also a fourth read-only letter for the center of each axis (`x_center`, `y_center`, `z_center`). For the same letters but agnostic of which axis you are on, use `s l e` (start, length, end) and `c` for center.

## What if your formula has a mistake

Any parse failure shows a red underline under the bad portion of the cell. Hovering over the underline reveals the message. A small panel below offers buttons that propose fixes — substituting an operator, deleting the bad part, or replacing an unknown part name with a similar one nearby.

Citation: the formula language is implemented in `src/lib/ts/algebra/`. For the engineer's view (the parser, the evaluator, the propagation rule), see [the algebra page](../../architecture/core/algebra.md). For the error overlay's behaviour, see [the errors page](../../architecture/core/errors.md).

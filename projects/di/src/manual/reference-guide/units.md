# Units

The app stores every length the same way internally. What changes when you choose a different unit family is only what you see and what you can type.

## Choosing a family

Open the preferences section in the side panel. The units selector lists four families — imperial, metric, marine, archaic. Pick one. Every dimension on the canvas re-formats; every formula cell re-formats; every dimension input from now on parses in the new family.

The choice is remembered between sessions.

## What each family contains

- **Imperial.** Inches, feet, yards, miles. Lengths display as feet and inches with a fractional inch part — for example, `5' 3 1/4"`.
- **Metric.** Angstroms, nanometres, micrometres, millimetres, centimetres, metres, kilometres. Lengths display as a decimal in the unit closest to the value's magnitude.
- **Marine.** Fathoms, nautical miles. Lengths display as decimals.
- **Archaic.** Hands, spans, cubits, ells, rods, perches, chains, furlongs, leagues. Decimal display.

## Precision

A separate precision setting controls how detailed the display is. For imperial, precision steps from feet-only at the coarsest, through whole inches, halves, quarters, eighths, sixteenths, thirty-seconds, and sixty-fourths. For the other families, precision is the number of decimal places, from zero to three.

## Typing in a value

You can type a number in any unit, regardless of the family you have chosen. The system tries three reads in order. First, if the number has a foot tick or an inch tick (`5' 3 1/4"`), the compound imperial reader takes it. Second, any unit's display symbol (`mm`, `cm`, `m`, `ft`, `yd`, `cubit`, and so on) is recognised as a suffix. Third, a bare number is read in the family's default unit — foot for imperial, metre for metric, fathom for marine, cubit for archaic.

Citation: the preferences selector lives at `src/lib/svelte/details/D_Preferences.svelte`. The full units behavior is described on [the units page](../../architecture/core/units.md).

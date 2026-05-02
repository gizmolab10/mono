# Errors

The errors module is in charge of taking a parser failure or a runtime constraint failure and turning it into something the user can act on: a red span under the bad portion of the formula, a plain-English message, and one or more buttons that propose a fix.

Citation: `src/lib/ts/algebra/Errors.ts`.

## What an error carries

Every error the user sees is built around five pieces.

- The full text of the formula at the time it failed.
- The character span — where the bad portion starts and how long it is.
- The plain-English message.
- A list of suggestion buttons. Each suggestion has a label and a candidate replacement formula; some commit immediately, others go back into the input field for the user to keep editing.
- The original throw that produced the failure (kept for diagnostics; the message the user sees is the friendly one above).

Citation: `Errors.ts` lines 11-19.

## How the right message gets chosen

A single classifier looks at the throw and routes it to one of several factories.

- **Tail junk.** If the failure is near the end of the input and what remains is non-value characters, the classifier widens the span backward across operators and dots and routes to the incomplete-formula factory.
- **Truncated input.** If the parser reports it ran out of input, the classifier routes to the incomplete-formula factory. The message reads "Formula is incomplete, did you want to:" and offers two buttons — delete the offending tail, or keep the input as is and add more.
- **Otherwise.** The classifier routes to the bad-syntax factory. If the bad portion is itself an operator (or sits next to one), the only suggestion is "delete it." Otherwise the suggestions offer to substitute each of the four arithmetic operators for the bad portion, plus a delete button.

Citation: `Errors.ts` lines 30-63 (classifier and bad-syntax factory), lines 65-74 (incomplete-formula factory).

## Other shapes the user runs into

- **Unknown object name.** Suggestions are sibling-and-cousin names walked up the parent chain, ranked by a fuzzy match. A delete button is offered when the bad name sits between two dots.
- **Unknown attribute on a known object.** Suggestions are the thirteen valid attribute letters.
- **A bare object name where a value was expected.** The classifier looks at the operator next to the name and offers to delete it. If there is no operator the message just says the name is an object, not a value.
- **A leading dot or an unexpected dot inside a name.** The dot is highlighted; the only suggestion is "delete it."
- **A negative value.** The classifier finds the topmost subtraction at paren depth zero and offers to swap the two operands. If the minus is unary, it offers to delete it.
- **Junk before a number.** A trailing number gets recognised; everything to its left is offered for deletion.
- **A cycle.** The chain of references that closed the loop is shown in the message; no suggestions, since the cycle has to be broken at the user's choice.

Citation: `Errors.ts` lines 76-150 (object, attribute, bare-object, dot factories), lines 152-194 (negative value), lines 196-210 (junk before a number), lines 212-215 (cycle).

## Where errors are stored

Errors are kept per attribute, keyed by part-and-attribute. The same store is also queried to render the red underline and the hover overlay. The store is cleared per attribute when the user edits the cell, or wholesale when a new scene is loaded.

Citation: `Errors.ts` lines 26, 219-237.

## How a name is checked before it lands

When the user types a new name for a part or a named value, the validator runs three checks: only letters, digits, underscore, and space are allowed; the name cannot collide with a reserved attribute letter; the name cannot collide with a sibling part or a named value. Cousins under different parents are allowed to share a name; named values are global.

Citation: `Errors.ts` lines 300-326.

## How the span lands on the right characters

When a parser throw carries a "got 'X'" or "at position N" hint, the span extractor pulls those out and widens the span across consecutive non-name characters. When the throw mentions running out of input, the span is the last non-blank character.

Citation: `Errors.ts` lines 329-347.

## Throwing one out of an inner call

A small wrapper class lets a deep parsing site throw a structured-error object out through normal exception channels; the catch site at the cell-edit boundary unwraps it and stores it.

Citation: `Errors.ts` lines 354-360.

## Tests

Parse-error classification is pinned down in `src/lib/ts/tests/Errors.test.ts`.

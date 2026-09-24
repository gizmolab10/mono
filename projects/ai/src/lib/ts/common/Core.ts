// Everything ai adopts from core, in one file. Each line says where the thing really lives —
// through the "core" alias that tsconfig, vite.config and vitest.config all know. Only this
// file reaches through it, the stylesheet aside, which main.ts imports itself; every other ai
// file imports here. What the host owes for colors — reading remembered choices in and writing
// changes back — is paid in main.ts.
//
// The first three lines keep ov's order: Constants must be taken before Colors.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { default, k } from 'core/ts/common/Constants';
export { Colors, colors } from 'core/ts/utilities/Colors';
export { debug } from 'core/ts/common/Debug';
export { Preferences } from 'core/ts/utilities/Preferences';
export { hit_target } from 'core/ts/events/Hit_Target';
export { T_Hit_Target } from 'core/ts/types/Hit_Targets';
export { Point } from 'core/ts/types/Coordinates';
export { hits } from 'core/ts/events/Hits';
export { free_thumb } from 'core/ts/utilities/Thumb';
export type { Free_Thumb } from 'core/ts/utilities/Thumb';
export { CHECKBOX, svg_paths } from 'core/ts/utilities/SVG_Paths';
export { Direction } from 'core/ts/types/Angle';
export { foldable_headings, hidden_pieces, top_headings } from 'core/ts/utilities/Sections';
export { default as Separator } from 'core/svelte/support/Separator.svelte';
export { default as Steppers } from 'core/svelte/support/Steppers.svelte';
export { gap_below_line } from 'core/ts/utilities/Separator_Spacing';
export { default as Action, T_Position } from 'core/ts/types/Action';
export { T_Edge } from 'core/ts/utilities/Sectioning';
export { default as Section } from 'core/svelte/support/Section.svelte';

// Everything (currently) lv adopts from core, in one file. Each line says where the
// thing really lives — through the "core" alias that tsconfig and vite.config both
// know. Only this file reaches through the alias; every other lv file imports here.
//
// The stylesheet is the one thing that does not pass through: main.ts imports lv's
// own css itself, since a stylesheet has no exports and where it loads decides which
// rule wins between two that match equally.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { default, k } from 'core/ts/common/Constants';	// VITAL for Colors
export { Colors, colors } from 'core/ts/utilities/Colors';

// Who is under the cursor, and what a press on them means. The host owes it the
// cursor itself — App.svelte hands over every move, press and release.
export { default as S_Mouse } from 'core/ts/events/S_Mouse';
export { WAY_OUT, hit_target } from 'core/ts/events/Hit_Target';
export { hits } from 'core/ts/events/Hits';
export { Point, Rect, Size } from 'core/ts/types/Coordinates';
export { T_Drag, T_Hit_Target, T_Mouse_Detection } from 'core/ts/types/Hit_Targets';
export { T_Edge } from 'core/ts/utilities/Sectioning';

// Components come through here too, so the alias is still named in one file only.
export { default as Hamburger } from 'core/svelte/support/Hamburger.svelte';
export { default as Section } from 'core/svelte/support/Section.svelte';
export { default as Separator } from 'core/svelte/support/Separator.svelte';

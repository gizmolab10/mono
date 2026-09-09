// Everything (currently) mj adopts from core, in one file. Each line says where the
// thing really lives — through the "core" alias that tsconfig and vite.config both
// know. Only this file reaches through the alias; every other mj file imports here.
//
// The first four lines keep ov's order: Constants must be taken before Colors.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { debug } from 'core/ts/common/Debug';
export { default, k } from 'core/ts/common/Constants';
export { Colors, colors } from 'core/ts/utilities/Colors';
export { Preferences } from 'core/ts/utilities/Preferences';

// Action and S_Mouse are default exports in core; Constants already owns the default here,
// so each takes its own name on the way through.
export { default as Action, T_Position } from 'core/ts/types/Action';
export { default as S_Mouse } from 'core/ts/events/S_Mouse';
export { Point } from 'core/ts/types/Coordinates';
export { hit_target } from 'core/ts/events/Hit_Target';
export { hits } from 'core/ts/events/Hits';
export { start_tips, w_tip } from 'core/ts/utilities/Tooltip';

// Components come through here too, so the alias is still named in one file only.
export { default as Hamburger } from 'core/svelte/support/Hamburger.svelte';
export { default as Separator } from 'core/svelte/support/Separator.svelte';
export { default as Stack } from 'core/svelte/support/Stack.svelte';
export { default as ToolTip } from 'core/svelte/support/ToolTip.svelte';

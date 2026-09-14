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

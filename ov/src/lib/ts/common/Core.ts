// Everything (currently) ov deploys from core, in one file. Each line says
// where the thing really lives — through the "core" alias both tsconfig and
// vite know. What the host owes for colors — reading remembered choices in
// and writing changes back — is paid in main.ts.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { default, k } from 'core/ts/common/Constants';	// VITAL for Colors
export { Colors, colors } from 'core/ts/utilities/Colors';

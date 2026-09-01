// Everything (currently) ov deploys from core, in one file. Each line says
// where the thing really lives — through the "core" alias both tsconfig and
// vite know. What the host owes for colors — reading remembered choices in
// and writing changes back — is paid in main.ts.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { default, k } from 'core/ts/common/Constants';	// VITAL for Colors
export { Colors, colors } from 'core/ts/utilities/Colors';

// Action and S_Mouse are default exports in core; Constants already owns the default
// here, so each takes its own name on the way through.
export { default as Action, T_Position } from 'core/ts/types/Action';
export { default as S_Mouse } from 'core/ts/events/S_Mouse';
export { T_Details } from 'core/ts/types/Details';
export { T_Drag, T_Hit_Target, T_Mouse_Detection } from 'core/ts/types/Hit_Targets';
export type { Attribute_Keys, Axis_Name, Bound, Dictionary, Integer } from 'core/ts/types/Types';
export { BETWEEN, ELLIPSIS, words_that_fit } from 'core/ts/utilities/Fitting';
export { in_thousands } from 'core/ts/utilities/Numbers';
export { all_folded, foldable_headings, hidden_pieces, own_words, section_span, top_headings } from 'core/ts/utilities/Sections';
export { children_of, natural_height, smooth_height } from 'core/ts/utilities/Smooth_Height';
export { SHORTEST_PART, free_thumb } from 'core/ts/utilities/Thumb';
export type { Free_Thumb } from 'core/ts/utilities/Thumb';

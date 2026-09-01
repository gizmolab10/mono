// Everything (currently) ov deploys from core, in one file. Each line says
// where the thing really lives — through the "core" alias both tsconfig and
// vite know. What the host owes for colors — reading remembered choices in
// and writing changes back — is paid in main.ts.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { debug } from 'core/ts/common/Debug';
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
export type { Stacked, T_Foot } from 'core/ts/types/Stacked';

export { Direction, default as Angle } from 'core/ts/types/Angle';
export { Point, Rect, Size } from 'core/ts/types/Coordinates';
export { WAY_OUT, hit_target } from 'core/ts/events/Hit_Target';
export type { Hit_Target_Options } from 'core/ts/events/Hit_Target';
export { hits } from 'core/ts/events/Hits';
export { CHECKBOX, svg_paths } from 'core/ts/utilities/SVG_Paths';
export { T_Edge, USUAL_GAP, folded_height, gap_above, gap_inside, thickness_of } from 'core/ts/utilities/Sectioning';
export { centers_of, distances_between, gap_below_line, report_gaps_below_lines, report_line_spacing } from 'core/ts/utilities/Separator_Spacing';
export { back_direction, forward_direction, mark_is_live, shows_mark } from 'core/ts/utilities/Stepping';
export { start_tips, tip, w_tip } from 'core/ts/utilities/Tooltip';

// Components come through here too, so the alias is still named in one file only.
export { default as Big_Pill } from 'core/svelte/support/Big_Pill.svelte';
export { default as BuildNotes } from 'core/svelte/support/BuildNotes.svelte';
export { default as Hamburger } from 'core/svelte/support/Hamburger.svelte';
export { default as Section } from 'core/svelte/support/Section.svelte';
export { default as Stack } from 'core/svelte/support/Stack.svelte';
export { default as Status_Line } from 'core/svelte/support/Status_Line.svelte';
export { default as Separator } from 'core/svelte/support/Separator.svelte';
export { default as Steppers } from 'core/svelte/support/Steppers.svelte';
export { default as ToolTip } from 'core/svelte/support/ToolTip.svelte';

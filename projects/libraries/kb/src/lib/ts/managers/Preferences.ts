import { customizations } from '../common/Customizations';
import { Preferences } from '../common/Core';

/**
 * Preferences — what the browser remembers between visits.
 *
 * The way to read and write one is core's. What is kb's: every name below, which is
 * the word a value is saved under. The start every saved name wears is the host's, its
 * prefix in the customizations, read when asked, since step 9 of the plan. The stores
 * the managers make read storage the moment kb is imported, so a host sets its prefix
 * ahead of importing kb, as ai's Convert_Preferences.ts does. Each
 * name is spelled the same way: the parts of the name joined by underscores, plainest
 * part first ("show_details", not "showDetails"), so the code and the browser's saved
 * settings always match.
 *
 * ji carries a pile of renaming and sweeping code because it has years of saved
 * names to bring forward. Overview has none, so none of that is here.
 */

export enum T_Preference {
	// Layout
	details_open    = 'details_open',
	show_details    = 'show_details',

	// Colors
	color_accent    = 'color_accent',
	color_background = 'color_background',
	color_text      = 'color_text',

	// Filters on the guide list
	filter_project  = 'filter_project',
	filter_kind     = 'filter_kind',
	filter_folder   = 'filter_folder',
	filter_tags     = 'filter_tags',
	tag_picking     = 'tag_picking',
	filter_text     = 'filter_text',

	// The guide list itself
	show_filters    = 'show_filters',
	filters_folded  = 'filters_folded',
	areas_open      = 'areas_open',
	folders_shut    = 'folders_shut',
	show_folders    = 'show_folders',
	sorts           = 'sorts',
	scroll_files_to = 'scroll_files_to',
	view_file       = 'view_file',
	selected_files  = 'selected_files',
	current_op      = 'current_op',
	edit_multiple   = 'edit_multiple',

	// Reading one guide
	show_labels     = 'show_labels',
	form_folded     = 'form_folded',
	fold_titles     = 'fold_titles',
	show_search     = 'show_search',
	show_controls   = 'show_controls',
	show_backlinks  = 'show_backlinks',
	search_at       = 'search_at',
	left_at         = 'left_at',

	// Putting things right
	includes_work   = 'includes_work',

	// The rules form
	rule_reads      = 'rule_reads',
	rule_gives      = 'rule_gives',
	rule_index      = 'rule_index',

	// The line along the bottom
	show_status     = 'show_status',
	status_words    = 'status_words',
	status_findings = 'status_findings',
	status_made     = 'status_made',
}

// Every saved name starts with the host's prefix, kb_ where no host has set one.
export const preferences = new Preferences(() => customizations.prefix);

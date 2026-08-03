import { w_operation, T_Operation } from './Operations';
import { preferences, T_Preference } from './Preferences';
import { debug } from '../common/Debug';
import { get, writable } from 'svelte/store';

// The one line of words the app has for the person using it — a thing that just happened, a
// question, or something that went wrong. It sits along the bottom of the window and stays
// there until it is dismissed, so nothing said is ever missed by looking away. Whether it is
// showing, and what it says, are both remembered across visits.

// Whether putting things right reaches into the work notes. Off, a link into one is passed
// over whether it leads anywhere or not — those notes come and go, and are not guides.
export const w_includes_work = preferences.persistent<boolean>(T_Preference.includes_work, false);

export const w_show_status = preferences.persistent<boolean>(T_Preference.show_status, true);
export const w_status      = preferences.persistent<string>(T_Preference.status_words, '');

// One thing found while putting things right. When it names a guide and a link, the report
// draws it as a row that can be clicked: that opens the guide for editing with the link lit.
export type Finding = { words: string; key?: string; link?: string };
export const w_findings = writable<Finding[]>([]);

/**
 * Say something. One line's worth goes along the bottom and stays until it is dismissed;
 * anything written as several lines is read as a report instead, since the bottom of a
 * window is no place for a list.
 */
export function show_status(words: string, findings: Finding[] = []): void {
	w_status.set(words);
	w_findings.set(findings);
	w_show_status.set(true);
	if (findings.length > 0 || words.split('\n').length > 2) { show_status_as_report(); return; }
	debug.log(`Status line: "${words}".`);
}

/** Take the line away. Whatever was being read stays where it is. */
export function hide_status(): void {
	w_show_status.set(false);
	w_status.set('');
	w_findings.set([]);
	if (get(w_operation) === T_Operation.report) { w_operation.set(T_Operation.browse); }
}

/**
 * The words are too many for one line along the bottom, so they are read as a report in the
 * content box instead. The line itself steps aside while that is showing.
 */
export function show_status_as_report(): void {
	if (get(w_operation) === T_Operation.report) { return; }
	w_operation.set(T_Operation.report);
	debug.log('Status line: too tall for the bottom of the window, so it is being read as a report instead.');
}

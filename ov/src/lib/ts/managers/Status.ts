import { w_operation, T_Operation } from './Operations';
import { preferences, T_Preference } from './Preferences';
import { moment_written_out } from '../utilities/Labels';
import { debug } from '../common/Debug';
import { get, writable } from 'svelte/store';

// The one line of words the app has for the person using it — a thing that just happened, a
// question, or something that went wrong. It sits along the bottom of the window and stays
// there until it is dismissed, so nothing said is ever missed by looking away. Whether it is
// showing, and what it says, are both remembered across visits.

export const w_show_status = preferences.persistent<boolean>(T_Preference.show_status, true);
export const w_status      = preferences.persistent<string>(T_Preference.status_words, '');

// One thing found while putting things right. When it names a guide and a link, the report
// draws it as a row that can be clicked: that opens the guide for editing with the link lit.
//
// What was found is remembered along with the words above it and whether the line is showing, so a
// reload comes back to the whole report rather than to its first line with nothing under it. It is
// a report of what was true when it was made: mend one of these and its row stays until the check
// is run again.
export type Finding = { words: string; key?: string; link?: string; find?: string };
export const w_findings = preferences.persistent<Finding[]>(T_Preference.status_findings, []);

// When the report was made, written out for reading. Remembered with it, and shown at its top —
// so a report kept across a reload never reads as this minute's.
export const w_findings_made = preferences.persistent<string>(T_Preference.status_made, '');

/**
 * Something the app has noticed and will do only if asked: the words say what was found, the
 * button says what pressing it does. The cross that dismisses the line is the answer "no" —
 * nothing happens, and nothing is asked again until the same thing is noticed again.
 *
 * It is not remembered across visits, since what it would do is an action rather than a value.
 */
export type Offer = { says: string; does: () => void };
export const w_offer = writable<Offer | null>(null);

/**
 * Say something. One line's worth goes along the bottom and stays until it is dismissed;
 * anything written as several lines is read as a report instead, since the bottom of a
 * window is no place for a list.
 */
export function show_status(words: string, findings: Finding[] = []): void {
	w_status.set(words);
	w_findings.set(findings);
	w_findings_made.set(findings.length > 0 ? moment_written_out(new Date()) : '');
	w_offer.set(null);
	w_show_status.set(true);
	if (findings.length > 0 || words.split('\n').length > 2) { show_status_as_report(); return; }
	debug.log(`Status line: "${words}".`);
}

/**
 * Say what was found, and offer to act on it. Nothing happens unless the button is pressed;
 * dismissing the line is the answer "no".
 */
export function offer_status(words: string, says: string, does: () => void): void {
	w_status.set(words);
	w_findings.set([]);
	w_findings_made.set('');
	w_offer.set({ says, does });
	w_show_status.set(true);
	debug.log(`Status line: "${words}" — offering "${says}".`);
}

/** Take the line away. Whatever was being read stays where it is. */
export function hide_status(): void {
	w_show_status.set(false);
	w_status.set('');
	w_findings.set([]);
	w_findings_made.set('');
	w_offer.set(null);
	if (get(w_operation) === T_Operation.report) { w_operation.set(T_Operation.browse); }
}

/** Press the offer: do the thing, then take the line away. */
export function take_the_offer(): void {
	const offer = get(w_offer);
	if (!offer) { return; }
	debug.log(`Status line: "${offer.says}" was pressed.`);
	offer.does();
	hide_status();
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

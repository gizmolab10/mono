// What is true of mj and of no other host. core knows none of it, and nothing here is
// remembered between visits — a viewer's own choices live in gallery's Persistence, and
// the sizes and colors are core's. If core could ever want it, it belongs to core; if a
// viewer can change it, it is remembered; otherwise it is here.
//
// Gathered into one value, so a caller names the file rather than every switch. gallery
// reads the last two, so Main.ts hands them to gallery's own switches before anything
// mounts.

export const customizations = {
	name   : '2026 planting',	// what the controls row calls this project, centered in it
	home   : 'mj',		// the page gallery shows at the root address
	prefix : 'mj.',		// what every remembered value is saved under
};

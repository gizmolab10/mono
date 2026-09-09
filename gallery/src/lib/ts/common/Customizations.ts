// What is true of gallery and of no other host. core knows none of it, and nothing here is
// remembered between visits — a viewer's own choices live in Persistence, and the sizes
// and colors are core's. If core could ever want it, it belongs to core; if a viewer can
// change it, it is remembered; otherwise it is here.
//
// Gathered into one value, so a caller names the file rather than every switch. A host
// that imports gallery sets these before it mounts. gallery reads them only when asked,
// never while its files load, so the host's values are the ones every file sees.

export const customizations = {
	enable_sidebar : false,			// the sidebar's hamburger is drawn
	home           : 'Home',		// the page shown at the root address
	prefix         : 'gallery.',	// what every remembered value is saved under
};

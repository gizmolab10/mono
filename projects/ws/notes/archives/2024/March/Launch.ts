import { g, k, debug, builds, debugReact, dbDispatch, persistLocal } from '../common/GlobalImports'

class Launch {
	async setup() {
		document.title = g.browserTitle;
		builds.setup();
		persistLocal.restore();
		k.applyQueryStrings();
		persistLocal.applyQueryStrings();
		debug.applyQueryStrings();
		debugReact.applyQueryStrings();
		await dbDispatch.applyQueryStrings(); // do these two last
		g.setup_reacts();
	}
    
}

export const launch = new Launch();

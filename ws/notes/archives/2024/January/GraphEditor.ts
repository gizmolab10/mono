import { k, get, Hierarchy, dbDispatch } from '../../../src/lib/ts/common/GlobalImports';
import { s_paths_grabbed } from '../../../src/lib/ts/managers/State';

//////////////////////////////////////
//									//
//	 		handle key events		//
//	 and compound CRUD operations	//
//									//
//////////////////////////////////////

export default class GraphEditor {
	get hierarchy(): Hierarchy { return dbDispatch.db.hierarchy }

	async handleKeyDown(event: KeyboardEvent) {
		const h = this.hierarchy;
		let pathGrab = h.grabs.latestPathGrabbed(true);
		if (event.type == 'keydown') {
			const OPTION = event.altKey;
			const SHIFT = event.shiftKey;
			const COMMAND = event.metaKey;
			const EXTREME = SHIFT && OPTION;
			const key = event.key.toLowerCase();
			const rootPath = h.rootPath;
			if (!pathGrab && rootPath) {
				rootPath.becomeHere();
				rootPath.grabOnly();		// update crumbs and dots
				pathGrab = rootPath;
			}
			if (k.allowGraphEditing) {
				if (pathGrab && k.allowTitleEditing) {
					switch (key) {
						case 'd':		await h.thing_edit_remoteDuplicate(pathGrab); break;
						case ' ':		await h.path_edit_remoteCreateChildOf(pathGrab); break;
						case '-':		if (!COMMAND) { await h.thing_edit_remoteAddLine(pathGrab); } break;
						case 'tab':		await h.path_edit_remoteCreateChildOf(pathGrab.parentPath); break; // Title editor also makes this call
						case 'enter':	pathGrab.startEdit(); break;
					}
				}
				switch (key) {
					case 'delete':
					case 'backspace':	await h.paths_rebuild_traverse_remoteDelete(get(s_paths_grabbed)); break;
				}
			}
			if (pathGrab) {
				switch (key) {
					case '/':			pathGrab.becomeHere(); break;
					case 'arrowright':	await h.path_rebuild_remoteMoveRight(pathGrab, true, SHIFT, OPTION, EXTREME); break;
					case 'arrowleft':	event.preventDefault(); await h.path_rebuild_remoteMoveRight(pathGrab, false, SHIFT, OPTION, EXTREME); break;
				}
			}
			switch (key) {
				case '!':				h.rootPath?.becomeHere(); break;
				case '`':               event.preventDefault(); h.latestPathGrabbed_toggleToolsCluster(); break;
				case 'arrowup':			await h.latestPathGrabbed_rebuild_remoteMoveUp(true, SHIFT, OPTION, EXTREME); break;
				case 'arrowdown':		await h.latestPathGrabbed_rebuild_remoteMoveUp(false, SHIFT, OPTION, EXTREME); break;
			}
		}
	}

}

export const graphEditor = new GraphEditor();
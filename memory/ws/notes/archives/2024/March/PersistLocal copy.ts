import { s_thing_fontFamily, s_show_child_graph } from '../common/State';
import { g, k, Path, Point, dbDispatch } from '../common/GlobalImports'
import { s_show_details, s_user_graphOffset } from '../common/State';
import { s_path_here, s_paths_expanded } from '../common/State';
import { s_paths_grabbed } from '../common/State';

export enum IDPersistant {
	show_children  	= 'show_children',
	hashed_paths	= 'hashed_paths',
	title_atTop  	= 'title_atTop',
	expanded	 	= 'expanded',
	controls	 	= 'controls',
	grabbed		 	= 'grabbed',
	details		 	= 'details',
	origin		 	= 'origin',
	scale		 	= 'scale',
	here		 	= 'here',
	font		 	= 'font',
	db			 	= 'db',
}

class PersistLocal {
	// for backwards compatibility with {here, grabbed, expanded} stored as path strings not hashed paths
	usesHashedPaths = localStorage[IDPersistant.hashed_paths];
	ignorePaths = !this.usesHashedPaths || this.usesHashedPaths == 'undefined';
	pathsRestored = false;

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal();
		// this.writeToKey(IDPersistant.row_height, 20);
		// this.writeToKey(IDPersistant.dot_size, 13);

		if (this.ignorePaths) {
			this.writeToKey(IDPersistant.hashed_paths, true);
		}
		this.writeToKey(IDPersistant.title_atTop, false);
		g.showControls = this.readFromKey(IDPersistant.controls) ?? false;
		s_show_details.set(this.readFromKey(IDPersistant.details) ?? false);
		g.titleIsAtTop = this.readFromKey(IDPersistant.title_atTop) ?? false;
		s_thing_fontFamily.set(this.readFromKey(IDPersistant.font) ?? 'Arial');
		s_show_child_graph.set(this.readFromKey(IDPersistant.show_children) ?? true);
		s_user_graphOffset.set(this.readFromKey(IDPersistant.origin) ?? new Point());
		g.applyScale(!k.device_isMobile ? 1 : this.readFromKey(IDPersistant.scale) ?? 1);

		s_show_details.subscribe((_) => { g.graphRect_update(); });
		s_show_child_graph.subscribe((flag: boolean) => {
			this.writeToKey(IDPersistant.show_children, flag);
		})
	}

	paths_restore() {
		// assumes all relationships fetched and all paths computed
		if (!this.pathsRestored) {
			this.pathsRestored = true;
			const h = g.hierarchy;
			g.rootPath = h.path_remember_unique();
			s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.grabbed)?.map((n: number) => h.knownPath_byHash[n]) ?? [g.rootPath]);
			this.here_restore();
			this.expandeds_restore();

			for (const path of Object.values(h.knownPath_byHash)) {
				path.subscriptions_setup();
			}
	
			s_paths_grabbed.subscribe((paths: Array<Path>) => {
				const noPaths = paths == null || paths[0] == undefined;
				const hashedPaths = noPaths ? [] : paths.map(p => p.hashedPath);
				this.writeToDBKey(IDPersistant.grabbed, hashedPaths);
			});
	
			s_paths_expanded.subscribe((paths: Array<Path>) => {
				const noPaths = paths == null || paths[0] == undefined;
				const hashedPaths = noPaths ? [] : paths.map(p => p.hashedPath);
				this.writeToDBKey(IDPersistant.expanded, hashedPaths);
			});
	
			s_path_here.subscribe((path: Path) => {
				const noPath = path == null || path == undefined;
				const hashedPath = noPath ? null : path.hashedPath;
				this.writeToDBKey(IDPersistant.here, hashedPath);
			});
		}
	}

	here_restore() {
		const h = g.hierarchy;
		let pathToHere = g.rootPath;
		if (!this.ignorePaths) {
			const hereHashedPath = this.readFromDBKey(IDPersistant.here);
			if (hereHashedPath) {
				const herePath = h.knownPath_byHash[hereHashedPath];
				if (herePath) {
					pathToHere = herePath;
				}
			}
		}
		let here = h.thing_getForPath(pathToHere);
		if (here == null) {
			const lastGrabbedPath = h.grabs.path_lastGrabbed?.fromPath;
			if (lastGrabbedPath) {
				pathToHere = lastGrabbedPath;
			}
		}
		pathToHere.becomeHere();
	}

	expandeds_restore() {
		const h = g.hierarchy;
		const hashes: Array<number> = this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.expanded) ?? [];
		let paths: Array<Path> = [];
		for (const hash of hashes) {
			const path = h.knownPath_byHash[hash];
			if (path) {
				paths.push(path);
			}
		}
		let index = paths.length - 1;
		while (index >= 0) {
			const path = paths[index];
			if (path) {
				for (const id of path.ids) {
					const relationship = h.relationship_getForHID(id.hash());
					if (!relationship) {
						paths.slice(1, index);
						break;
					}
				}
			}
			index--;
		};
		s_paths_expanded.set(paths);
	}

	get dbType(): string { return dbDispatch.db.dbType; }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.dbType, value); }
	readFromDBKey(key: string): any | null { return this.readFromKey(key + this.dbType); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

}

export const persistLocal = new PersistLocal();

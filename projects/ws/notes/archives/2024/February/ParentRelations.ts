
import { Path, Thing } from '../../../src/lib/ts/common/GlobalImports';

export default class ParentRelations {
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }
	fromThingsFor(predicateHID: number): Array<Thing> { return this.toPathsFor(predicateHID).map(p => p.thing!); }
	parentPaths_setFor(predicateHID: number, paths: Array<Path>) { return this.parentPaths_byPredicateHID[predicateHID] = paths; }
	
	toPathsFor(predicateHID: number): Array<Path> {
		const toRelationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicateID, false, thing.id);
		const paths: Array<Path> = [];
		return paths;
	}

	assemble_from(path: Path) {			// path to thing
		const parentPath = path.fromPath;
		const predicateHID = path.predicateID.hash();
		let paths_from = this.toPathsFor(predicateHID);
		if (!parentPath.includedInPaths(paths_from)) {
			paths_from.push(parentPath);
			this.parentPaths_setFor(predicateHID, paths_from);
		}
	}

}

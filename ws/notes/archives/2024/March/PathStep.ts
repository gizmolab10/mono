import { Path, Relationship } from '../common/GlobalImports';

export default class PathStep extends Path {
	constructor(relationship: Relationship) {
		super(relationship.id, relationship.idPredicate);
	}

}
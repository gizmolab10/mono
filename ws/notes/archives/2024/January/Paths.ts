import { Path } from "../../../src/lib/ts/common/GlobalImports";

export default class Paths {
	knownP_byPathString: { [pathString: string]: Path } = {};

	add(path: Path) { this.knownP_byPathString[path.pathString.hash()] = path; }
	find(pathString: string) { return this.knownP_byPathString[pathString.hash()]; }

	uniquePath(pathString: string = '') {
		let path = this.find(pathString)
		if (!path) {
			path = new Path(pathString);
			this.add(path);
		}
		return path;
	}
}

export const paths = new Paths();

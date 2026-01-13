import { k, Thing, Ancestry } from '../common/GlobalImports'

class Exemplar extends Thing {

	constructor() {
		const name = k.exemplar;
		super(k.empty, name, 'this item is selected', '#b52', '?', true);
		const ancestry = new Ancestry(name)
		this.oneAncestry = ancestry;
		this.isExemplar = true;
		ancestry._thing = this;
	}

}

export const exemplar = new Exemplar();
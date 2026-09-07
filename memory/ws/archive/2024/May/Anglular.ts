export default class Anglular extends Number {
	static threeQuarters = new Anglular(Math.PI * 3 / 2);
	static quarter = new Anglular(Math.PI / 2);
	static full = new Anglular(Math.PI * 2);
	static half = new Anglular(Math.PI);
	static zero = new Anglular(0);

	_add(other: Anglular): Anglular { return new Angular(this.valueOf() + other.valueOf()); }
	add(other: Anglular): Anglular { return this._add(other).normalized; }

	get normalized(): Anglular {
		let result = new Angular(this.valueOf());
		while (result.valueOf() < Anglular.zero.valueOf()) {
			result = result._add(Anglular.full);
		}
		while (result > Anglular.full) {
			result = result._add(-Anglular.full);;
		}
		return result;
	}
}
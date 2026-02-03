export default class Attribute {
	value: number;
	name: string;

	constructor(name: string, value: number = 0) {
		this.value = value;
		this.name = name;
	}
}

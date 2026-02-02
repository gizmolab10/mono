export default class Attribute {
	value: number;
	name: string;

	constructor(name: string = '', value: number) {
		this.value = value;
		this.name = name;
	}
}

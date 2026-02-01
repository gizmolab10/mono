export default class Attribute {
	value: number;
	name: string;

	constructor(name: string = '', value: number) {
		this.name = name;
		this.value = value;
	}
}

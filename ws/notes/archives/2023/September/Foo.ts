// Define a Fiddle class with an async method fiddle
class Fiddle {
	async fiddle(): Promise<void> {
		console.log("Fiddling from Fiddle class...");
	}
}

// Define a DeeDee interface with a string property deeDee
interface DeeDee {
	deeDee: string;
}

// Foo class that extends Fiddle and implements DeeDee
export default class Foo extends Fiddle implements DeeDee {
	deeDee: string;

	constructor(deeDee: string) {
		super();
		this.deeDee = deeDee;
	}

	// Overriding the fiddle method from Fiddle class
	async fiddle(): Promise<void> {
		console.log("Fiddling from Foo class...");
	}

	// Additional method specific to Foo
	farther(): string {
		return "fast";
	}

	// Static method on Foo
	static farther(): string {
		return 'Static fast';
	}
}

// Usage
const fooInstance = new Foo("some value for DeeDee");

// Call the fiddle method
(async () => {
	await fooInstance.fiddle();
})();

// Access the deeDee property
console.log(fooInstance.deeDee); // Output: "some value for DeeDee"

// Call the farther method
console.log(fooInstance.farther()); // Output: "fast"

// Call the static farther method
console.log(Foo.farther()); // Output: "Static fast"

export enum Direction {
	down = Math.PI/6,
	right = Math.PI,
	up = Math.PI/2,
	left = 0,
}

export class FatTrianglePath {
	startingAngle: number;
	size: number;
	path = '';

	constructor(size: number, direction: number) {
		this.startingAngle = direction;
		this.size = size;
		const width = this.size;
		const height = this.size;
		const offsetX = width / 2;
		const offsetY = height / 2;
		const insetRatio = 0.35;
		const radius = Math.min(width, height) * insetRatio;
		const oneSixth = Math.PI / 3; // one sixth of a circle
		const oneThirtieth = Math.PI / 15; // one thirtieth of a circle
		const inner = { x: radius, y: 0 };
		const outer = { x: radius * 1.5, y: 0 };
		let start = { x: 0, y: 0 };
		let data = [];
		let index = 0;
		while (index < 3) {
			const angle = this.startingAngle + index * oneSixth * 2; // multiples of one third of a circle
			const halfWay = angle - oneSixth;
			const preceder = halfWay - oneThirtieth;
			const follower = halfWay + oneThirtieth;
			data.push({
				controlOne: this.rotatePoint(outer, preceder),
				controlTwo: this.rotatePoint(outer, follower),
				end:		this.rotatePoint(inner, angle),
			});
			index += 1;
		}

		data = data.map(d => ({
			controlOne: { x: d.controlOne.x + offsetX, y: d.controlOne.y + offsetY },
			controlTwo: { x: d.controlTwo.x + offsetX, y: d.controlTwo.y + offsetY },
			end: { x: d.end.x + offsetX, y: d.end.y + offsetY },
		}));

		start = data[2].end;
		this.path = `M${start.x},${start.y},${data.map(d => `C${d.controlOne.x},${d.controlOne.y} ${d.controlTwo.x},${d.controlTwo.y} ${d.end.x},${d.end.y}`).join('')}Z`;
	}

	rotatePoint(point: {x:number, y:number}, angle: number) {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return {
			x: point.x * cos - point.y * sin,
			y: point.x * sin + point.y * cos
		};
	}
}
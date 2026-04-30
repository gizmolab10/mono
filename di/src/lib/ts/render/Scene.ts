import type Smart_Object from '../runtime/Smart_Object';
import type { O_Scene } from '../types/Interfaces';
import { vec3 } from 'gl-matrix';

class Scene {
	private objects: Map<string, O_Scene> = new Map();
	private id_counter = 0;

	create(config: {
		edges: [number, number][];
		faces?: number[][];
		so: Smart_Object;
		parent?: O_Scene;
		position?: vec3;
		color?: string;
	}): O_Scene {
		const id = `obj_${this.id_counter++}`;
		const obj: O_Scene = {
			id,
			so: config.so,
			edges: config.edges,
			faces: config.faces,
			position: config.position ?? vec3.fromValues(0, 0, 0),
			color: config.color ?? 'rgba(255, 255, 255,',
			parent: config.parent,
		};
		this.objects.set(id, obj);
		return obj;
	}

	get(id: string): O_Scene | undefined {
		return this.objects.get(id);
	}

	get_all(): O_Scene[] {
		return Array.from(this.objects.values());
	}

	destroy(id: string): boolean {
		return this.objects.delete(id);
	}

	clear(): void {
		this.objects.clear();
	}

	/** Move an entry to a new spot in the master order. The entry whose id is
	 *  given is removed from its current position and re-inserted just before
	 *  the entry with id `before_id`. Pass null to move to the end. The visible
	 *  parts table reads tree order from this list, so reordering here changes
	 *  sibling order. */
	move(id: string, before_id: string | null): void {
		if (!this.objects.has(id)) return;
		if (before_id === id) return;
		const entries = Array.from(this.objects.entries());
		const moving = entries.find(e => e[0] === id);
		if (!moving) return;
		const without = entries.filter(e => e[0] !== id);
		const next = new Map<string, O_Scene>();
		if (before_id === null) {
			for (const e of without) next.set(e[0], e[1]);
			next.set(moving[0], moving[1]);
		} else {
			let inserted = false;
			for (const e of without) {
				if (!inserted && e[0] === before_id) { next.set(moving[0], moving[1]); inserted = true; }
				next.set(e[0], e[1]);
			}
			if (!inserted) next.set(moving[0], moving[1]);
		}
		this.objects = next;
	}
}

export const scene = new Scene();

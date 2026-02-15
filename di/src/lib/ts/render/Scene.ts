import { vec3 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import type Smart_Object from '../runtime/Smart_Object';

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
}

export const scene = new Scene();

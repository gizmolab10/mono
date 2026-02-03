import { quat, vec3 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { Point3 } from '../types/Coordinates';

class Scene {
  private objects: Map<string, O_Scene> = new Map();
  private id_counter = 0;

  create(config: {
    vertices: Point3[];
    edges: [number, number][];
    faces?: number[][];
    position?: vec3;
    scale?: number;
    color?: string;
    parent?: O_Scene;
  }): O_Scene {
    const id = `obj_${this.id_counter++}`;
    const obj: O_Scene = {
      id,
      vertices: config.vertices,
      edges: config.edges,
      faces: config.faces,
      orientation: quat.create(),
      position: config.position ?? vec3.fromValues(0, 0, 0),
      scale: config.scale ?? 1,
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

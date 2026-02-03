import { quat } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d } from '../managers/Hits_3D';
import { Point } from '../types/Coordinates';

type T_Handle_Drag = (delta: Point) => void;

class Events_3D {
  private canvas!: HTMLCanvasElement;
  private is_dragging = false;
  private last_position: Point = Point.zero;
  private on_drag: T_Handle_Drag | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', (e) => {
      this.is_dragging = true;
      this.last_position = new Point(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.is_dragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);

      if (!this.is_dragging) {
        const hit = hits_3d.test(point);
        hits_3d.set_hover(hit);
      } else if (this.on_drag) {
        const current = new Point(e.clientX, e.clientY);
        const delta = this.last_position.vector_to(current);
        this.last_position = current;
        this.on_drag(delta);
      }
    });
  }

  set_drag_handler(callback: T_Handle_Drag): void {
    this.on_drag = callback;
  }

  rotate_object(obj: O_Scene, delta: Point, sensitivity = 0.01): void {
    const rot_x = quat.create();
    const rot_y = quat.create();
    quat.setAxisAngle(rot_x, [1, 0, 0], delta.y * sensitivity);
    quat.setAxisAngle(rot_y, [0, 1, 0], delta.x * sensitivity);
    quat.multiply(obj.orientation, rot_y, obj.orientation);
    quat.multiply(obj.orientation, rot_x, obj.orientation);
    quat.normalize(obj.orientation, obj.orientation);
  }
}

export const e3 = new Events_3D();

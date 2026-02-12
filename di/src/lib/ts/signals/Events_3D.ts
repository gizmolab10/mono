import { hits_3d } from '../managers/Hits_3D';
import { dimensions } from '../editors/Dimension';
import { face_label } from '../editors/Face_Label';
import { drag } from '../editors/Drag';
import { Point } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';

type T_Handle_Drag = (prev_mouse: Point, curr_mouse: Point) => void;
type T_Handle_Wheel = (delta: number, fine: boolean) => void;

class Events_3D {
  private did_drag = false;  // true if mouse moved while dragging
  private is_dragging = false;
  private mouse_in_canvas = false;
  private last_canvas_position: Point = Point.zero;  // canvas-relative position
  private on_drag: T_Handle_Drag | null = null;
  private on_drag_end: (() => void) | null = null;
  private on_wheel: T_Handle_Wheel | null = null;

  init(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mouseenter', () => { this.mouse_in_canvas = true; });
    canvas.addEventListener('mouseleave', () => { this.mouse_in_canvas = false; });

    canvas.addEventListener('mousedown', (e) => {
      this.is_dragging = true;
      this.did_drag = false;

      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);
      this.last_canvas_position = point;

      const hit = hits_3d.hit_test(point);

      // Dimension or face label hit — don't start a drag, defer to mouseup for editing
      if (hit?.type === T_Hit_3D.dimension || hit?.type === T_Hit_3D.face_label) {
        drag.set_target(null);
        hits_3d.set_hover(null);
        return;
      }

      // Store what we're actually dragging (corner/edge/face)
      drag.set_target(hit);

      // Clear hover during drag (especially rotation)
      hits_3d.set_hover(null);

      // Face click → select that face
      // Corner/edge click → select best face (only if nothing selected yet)
      if (hit) {
        if (hit.type === T_Hit_3D.face) {
          hits_3d.set_selection(hit);
        } else if (!hits_3d.selection) {
          const face_hit = hits_3d.hit_to_face(hit);
          if (face_hit) hits_3d.set_selection(face_hit);
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.is_dragging && !this.did_drag && this.mouse_in_canvas) {
        const hit = hits_3d.hit_test(this.last_canvas_position);
        if (hit?.type === T_Hit_3D.dimension) {
          // Click on dimension label → begin editing
          const dim = dimensions.hit_test(this.last_canvas_position.x, this.last_canvas_position.y);
          if (dim) dimensions.begin(dim);
        } else if (hit?.type === T_Hit_3D.face_label) {
          // Click on face name → begin editing (begin() handles temporary selection)
          const label = face_label.hit_test(this.last_canvas_position.x, this.last_canvas_position.y);
          if (label) face_label.begin(label);
        } else if (!drag.has_target) {
          // Click on background → deselect
          hits_3d.set_selection(null);
        }
      }
      if (this.did_drag && this.on_drag_end) this.on_drag_end();
      this.is_dragging = false;
      this.did_drag = false;
      drag.clear();
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);

      if (!this.is_dragging) {
        const hit = hits_3d.hit_test(point);
        // Hover shows face — convert corner/edge hits to best face
        // But don't hover on already-selected face
        const face_hit = hit ? hits_3d.hit_to_face(hit) : null;
        const sel = hits_3d.selection;
        const is_selected = face_hit && sel &&
          face_hit.so === sel.so && face_hit.index === sel.index;
        hits_3d.set_hover(is_selected ? null : face_hit);
      } else if (this.on_drag) {
        const prev = this.last_canvas_position;
        const curr = point;
        if (prev.x !== curr.x || prev.y !== curr.y) {
          this.did_drag = true;
        }
        this.last_canvas_position = curr;
        this.on_drag(prev, curr);
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.on_wheel) {
        const delta = e.deltaY > 0 ? -1 : 1;  // scroll up = grow, down = shrink
        this.on_wheel(delta, e.shiftKey);
      }
    }, { passive: false });
  }

  set_drag_handler(callback: T_Handle_Drag): void {
    this.on_drag = callback;
  }

  set_drag_end_handler(callback: () => void): void {
    this.on_drag_end = callback;
  }

  set_wheel_handler(callback: T_Handle_Wheel): void {
    this.on_wheel = callback;
  }
}

export const e3 = new Events_3D();

import { quat, vec3 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d, type Hit_3D_Result } from '../managers/Hits_3D';
import { Point, Point3 } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';

type T_Handle_Drag = (delta: Point) => void;

class Events_3D {
  private canvas!: HTMLCanvasElement;
  private is_dragging = false;
  private did_drag = false;  // true if mouse moved while dragging
  private last_position: Point = Point.zero;
  private on_drag: T_Handle_Drag | null = null;
  private drag_target: Hit_3D_Result | null = null;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    canvas.addEventListener('mousedown', (e) => {
      this.is_dragging = true;
      this.did_drag = false;
      this.last_position = new Point(e.clientX, e.clientY);

      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);
      const hit = hits_3d.test(point);

      // Store what we're actually dragging (corner/edge/face)
      this.drag_target = hit;

      // Selection is only faces — clicking corner/edge or background keeps existing selection
      if (hit?.type === T_Hit_3D.face) {
        hits_3d.set_selection(hit);
      }
      // Clicking background or corner/edge keeps existing selection (for rotation)
    });

    window.addEventListener('mouseup', () => {
      // Click (no drag) on background → deselect
      if (!this.did_drag && !this.drag_target) {
        hits_3d.set_selection(null);
      }
      this.is_dragging = false;
      this.did_drag = false;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);

      if (!this.is_dragging) {
        const hit = hits_3d.test(point);
        // Hover shows face — convert corner/edge hits to best face
        hits_3d.set_hover(hit ? hits_3d.hit_to_face(hit) : null);
      } else if (this.on_drag) {
        const current = new Point(e.clientX, e.clientY);
        const delta = this.last_position.vector_to(current);
        if (!delta.isZero) {
          this.did_drag = true;
        }
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

  // Convert screen delta to local object delta, constrained to face plane
  // Returns movement in local object coordinates
  screen_to_local(delta: Point, scale = 0.01, face_normal?: Point3, orientation?: quat): Point3 {
    // Screen delta in world coords (view plane: right=+X, up=+Y)
    const view_delta = new Point3(delta.x * scale, -delta.y * scale, 0);

    if (!face_normal || !orientation) {
      return view_delta;
    }

    // Transform face normal from local to world coordinates
    const n_local = vec3.fromValues(face_normal.x, face_normal.y, face_normal.z);
    const n_world = vec3.create();
    vec3.transformQuat(n_world, n_local, orientation);

    // Project view_delta onto the face plane (remove component along normal)
    const normal = new Point3(n_world[0], n_world[1], n_world[2]);
    const dot = view_delta.dot(normal);
    const world_delta = view_delta.offset_by(normal.multiplied_equally_by(-dot));

    // Transform world delta back to local coordinates (inverse quaternion)
    const inv_orientation = quat.create();
    quat.invert(inv_orientation, orientation);
    const w = vec3.fromValues(world_delta.x, world_delta.y, world_delta.z);
    const local = vec3.create();
    vec3.transformQuat(local, w, inv_orientation);

    return new Point3(local[0], local[1], local[2]);
  }

  // Edit the current selection by moving vertices
  // Only works if dragging a corner or edge that belongs to the selected face
  // Movement is constrained to the face's 2D plane
  edit_selection(delta: Point): boolean {
    const sel = hits_3d.selection;
    const drag = this.drag_target;
    if (!sel || !drag) return false;

    // Selection must be a face
    if (sel.type !== T_Hit_3D.face) return false;

    // Drag target must be corner or edge (not face interior)
    if (drag.type === T_Hit_3D.face) return false;

    // Drag target must belong to same SO as selection
    if (drag.so !== sel.so) return false;

    // Get face normal and object orientation for plane constraint
    const face_normal = sel.so.face_normal(sel.index);
    const orientation = sel.so.scene?.orientation;
    const local_delta = this.screen_to_local(delta, 0.01, face_normal ?? undefined, orientation);

    // Check if dragged element belongs to the selected face
    switch (drag.type) {
      case T_Hit_3D.corner:
        if (!sel.so.corner_in_face(drag.index, sel.index)) return false;
        sel.so.move_vertex(drag.index, local_delta);
        return true;
      case T_Hit_3D.edge: {
        if (!sel.so.edge_in_face(drag.index, sel.index)) return false;
        // Move edge along its change-dimension (resize face)
        const dim = sel.so.edge_changes_dimension(drag.index, sel.index);
        if (!dim) return false;
        const amount = sel.so.move_edge_resize(drag.index, sel.index, local_delta);
        sel.so.update_dimension(dim, amount);
        return true;
      }
    }
    return false;
  }
}

export const e3 = new Events_3D();

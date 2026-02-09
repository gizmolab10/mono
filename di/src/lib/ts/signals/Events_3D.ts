import { quat, vec3, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d, type Hit_3D_Result } from '../managers/Hits_3D';
import { editor } from '../managers/Editor';
import { Point, Point3 } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { camera } from '../render/Camera';
import Smart_Object from '../runtime/Smart_Object';

type T_Handle_Drag = (prev_mouse: Point, curr_mouse: Point) => void;
type T_Handle_Wheel = (delta: number, fine: boolean) => void;

class Events_3D {
  private is_dragging = false;
  private did_drag = false;  // true if mouse moved while dragging
  private last_canvas_position: Point = Point.zero;  // canvas-relative position
  private on_drag: T_Handle_Drag | null = null;
  private on_wheel: T_Handle_Wheel | null = null;
  private drag_target: Hit_3D_Result | null = null;

  /** Unsnapped bound accumulators — tracks raw values during drag so snap doesn't eat small deltas. */
  private raw_bounds: Map<string, number> = new Map();

  init(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      this.is_dragging = true;
      this.did_drag = false;

      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);
      this.last_canvas_position = point;

      const hit = hits_3d.hit_test(point);

      // Store what we're actually dragging (corner/edge/face)
      this.drag_target = hit;
      this.raw_bounds.clear();

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

    window.addEventListener('mouseup', () => {
      if (!this.did_drag) {
        // Click (no drag) — check dimension rects first
        const dim_hit = editor.hit_test(this.last_canvas_position.x, this.last_canvas_position.y);
        if (dim_hit) {
          editor.begin(dim_hit);
        } else if (!this.drag_target) {
          // Click on background → deselect
          hits_3d.set_selection(null);
        }
      }
      this.is_dragging = false;
      this.did_drag = false;
      this.raw_bounds.clear();
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

  set_wheel_handler(callback: T_Handle_Wheel): void {
    this.on_wheel = callback;
  }

  scale_object(obj: O_Scene, delta: number, fine: boolean): void {
    const factor = fine ? (delta > 0 ? 1.02 : 0.98) : (delta > 0 ? 1.1 : 0.9);
    obj.scale *= factor;
  }

  rotate_object(obj: O_Scene, prev: Point, curr: Point, sensitivity = 0.01): void {
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const rot_x = quat.create();
    const rot_y = quat.create();
    quat.setAxisAngle(rot_x, [1, 0, 0], dy * sensitivity);
    quat.setAxisAngle(rot_y, [0, 1, 0], dx * sensitivity);
    quat.multiply(obj.so.orientation, rot_y, obj.so.orientation);
    quat.multiply(obj.so.orientation, rot_x, obj.so.orientation);
    quat.normalize(obj.so.orientation, obj.so.orientation);
  }

  // Edit the current selection by modifying SO bounds
  // Projects mouse positions onto face plane to get world-space delta
  edit_selection(prev_mouse: Point, curr_mouse: Point): boolean {
    const sel = hits_3d.selection;
    const drag = this.drag_target;
    if (!sel || !drag) return false;

    // Selection must be a face
    if (sel.type !== T_Hit_3D.face) return false;

    // Drag target must belong to same SO as selection
    if (drag.so !== sel.so) return false;

    const scene = sel.so.scene;
    if (!scene) return false;

    // Face drag: translate child SO in the plane of the front-most face
    if (drag.type === T_Hit_3D.face) {
      if (!scene.parent) return false; // root SO cannot be translated
      const front = hits_3d.front_most_face(sel.so);
      if (front < 0) return false;
      const delta = this.get_world_delta_on_face(prev_mouse, curr_mouse, front, scene);
      if (!delta) return false;
      this.apply_face_drag(sel.so, delta);
      return true;
    }

    // Get world-space delta by projecting both mouse positions onto face plane
    const world_delta = this.get_world_delta_on_face(prev_mouse, curr_mouse, sel.index, scene);
    if (!world_delta) return false;

    // Apply drag based on what we're dragging
    switch (drag.type) {
      case T_Hit_3D.corner:
        if (!sel.so.corner_in_face(drag.index, sel.index)) return false;
        this.apply_corner_drag(drag.index, sel.index, sel.so, world_delta);
        return true;
      case T_Hit_3D.edge:
        if (!sel.so.edge_in_face(drag.index, sel.index)) return false;
        this.apply_edge_drag(drag.index, sel.index, sel.so, world_delta);
        return true;
    }
    return false;
  }

  // Project two screen positions onto the face plane, return world-space delta
  private get_world_delta_on_face(
    prev: Point,
    curr: Point,
    face_index: number,
    scene: O_Scene
  ): Point3 | null {
    // Get face plane in world space
    const so = scene.so;
    const normal_local = so.face_normal(face_index);

    // Get world matrix for the scene object
    const world_matrix = this.get_world_matrix(scene);

    // Transform normal to world space (use inverse transpose for normals)
    const normal_matrix = mat4.create();
    mat4.invert(normal_matrix, world_matrix);
    mat4.transpose(normal_matrix, normal_matrix);

    const normal_world = vec3.fromValues(normal_local.x, normal_local.y, normal_local.z);
    vec3.transformMat4(normal_world, normal_world, normal_matrix);
    vec3.normalize(normal_world, normal_world);

    // Get a point on the face plane (use center of face vertices)
    const face_verts = so.face_vertices(face_index);
    const local_verts = so.vertices;
    let cx = 0, cy = 0, cz = 0;
    for (const vi of face_verts) {
      const v = local_verts[vi];
      cx += v.x; cy += v.y; cz += v.z;
    }
    cx /= face_verts.length;
    cy /= face_verts.length;
    cz /= face_verts.length;

    // Transform to world space
    const plane_point = vec3.fromValues(cx, cy, cz);
    vec3.transformMat4(plane_point, plane_point, world_matrix);

    // Ray-plane intersection for both mouse positions
    const prev_world = this.ray_plane_intersect(prev, plane_point, normal_world);
    const curr_world = this.ray_plane_intersect(curr, plane_point, normal_world);

    if (!prev_world || !curr_world) return null;

    // Delta in world space
    const delta_world = vec3.create();
    vec3.subtract(delta_world, curr_world, prev_world);

    // Transform delta back to local space
    const inv_world = mat4.create();
    mat4.invert(inv_world, world_matrix);

    // For delta vectors, transform without translation
    const delta_local = vec3.create();
    // Extract rotation/scale part only (use mat3 or manually zero translation)
    const delta_start = vec3.create();
    const delta_end = vec3.clone(delta_world);
    vec3.transformMat4(delta_start, delta_start, inv_world);
    vec3.transformMat4(delta_end, delta_end, inv_world);
    vec3.subtract(delta_local, delta_end, delta_start);

    return new Point3(delta_local[0], delta_local[1], delta_local[2]);
  }

  // Get world matrix for a scene object
  private get_world_matrix(obj: O_Scene): mat4 {
    const so = obj.so;
    const center: vec3 = [
      (so.x_min + so.x_max) / 2,
      (so.y_min + so.y_max) / 2,
      (so.z_min + so.z_max) / 2,
    ];
    const scale_vec = [obj.scale, obj.scale, obj.scale] as [number, number, number];

    // Rotate around the SO's exact 3D center: translate to center, rotate, translate back
    const local = mat4.create();
    mat4.fromTranslation(local, [-center[0], -center[1], -center[2]]);
    const rot = mat4.create();
    mat4.fromQuat(rot, so.orientation);
    mat4.multiply(local, rot, local);
    const from_center = mat4.create();
    mat4.fromTranslation(from_center, center);
    mat4.multiply(local, from_center, local);

    // Apply scale and position
    const scale_mat = mat4.create();
    mat4.fromScaling(scale_mat, scale_vec);
    mat4.multiply(local, scale_mat, local);
    const pos_mat = mat4.create();
    mat4.fromTranslation(pos_mat, obj.position);
    mat4.multiply(local, pos_mat, local);

    if (obj.parent) {
      const parent_world = this.get_world_matrix(obj.parent);
      mat4.multiply(local, parent_world, local);
    }

    return local;
  }

  // Intersect camera ray through screen point with a plane
  private ray_plane_intersect(
    screen: Point,
    plane_point: vec3,
    plane_normal: vec3
  ): vec3 | null {
    const ray = camera.screen_to_ray(screen.x, screen.y);

    // Ray: P = origin + t * dir
    // Plane: dot(P - plane_point, normal) = 0
    // Solve: dot(origin + t*dir - plane_point, normal) = 0
    // t = dot(plane_point - origin, normal) / dot(dir, normal)

    const denom = vec3.dot(ray.dir, plane_normal);
    if (Math.abs(denom) < 0.0001) return null;  // Ray parallel to plane

    const diff = vec3.create();
    vec3.subtract(diff, plane_point, ray.origin);
    const t = vec3.dot(diff, plane_normal) / denom;

    if (t < 0) return null;  // Intersection behind camera

    const result = vec3.create();
    vec3.scaleAndAdd(result, ray.origin, ray.dir, t);
    return result;
  }

  /** Accumulate raw delta for a bound, snap for storage. */
  private drag_bound(so: Smart_Object, bound: string, amount: number): void {
    const key = `${so.name}.${bound}`;
    const raw = this.raw_bounds.get(key) ?? so.get_bound(bound as any);
    const updated = raw + amount;
    this.raw_bounds.set(key, updated);
    so.set_bound(bound as any, Smart_Object.snap(updated));
  }

  // Apply face drag: translates SO by full local-space delta (no snap).
  // The face plane constraint is already enforced by the ray-plane projection
  // in world space — the local delta distributes across all 3 axes due to
  // the parent's rotation, so we apply it to all 3 axis pairs.
  private apply_face_drag(
    so: Smart_Object,
    local_delta: Point3
  ): void {
    so.set_bound('x_min', so.x_min + local_delta.x);
    so.set_bound('x_max', so.x_max + local_delta.x);
    so.set_bound('y_min', so.y_min + local_delta.y);
    so.set_bound('y_max', so.y_max + local_delta.y);
    so.set_bound('z_min', so.z_min + local_delta.z);
    so.set_bound('z_max', so.z_max + local_delta.z);
  }

  // Apply edge drag: affects 1 bound
  private apply_edge_drag(
    edge_index: number,
    face_index: number,
    so: typeof hits_3d.selection extends { so: infer T } | null ? T : never,
    local_delta: Point3
  ): void {
    const axis = so.edge_changes_axis(edge_index, face_index);
    const bound = so.edge_bound(edge_index, face_index);
    const axis_vec = so.axis_vector(axis);
    this.drag_bound(so, bound, local_delta.dot(axis_vec));
  }

  // Apply corner drag: affects 2 bounds
  private apply_corner_drag(
    corner_index: number,
    face_index: number,
    so: typeof hits_3d.selection extends { so: infer T } | null ? T : never,
    local_delta: Point3
  ): void {
    const axes = so.face_axes(face_index);
    for (const axis of axes) {
      const bound = so.vertex_bound(corner_index, axis);
      const axis_vec = so.axis_vector(axis);
      this.drag_bound(so, bound, local_delta.dot(axis_vec));
    }
  }
}

export const e3 = new Events_3D();

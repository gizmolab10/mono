import { quat, vec3, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d, type Hit_3D_Result } from '../managers/Hits_3D';
import { Point, Point3 } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { camera } from '../render/Camera';

type T_Handle_Drag = (prev_mouse: Point, curr_mouse: Point) => void;
type T_Handle_Wheel = (delta: number, fine: boolean) => void;

class Events_3D {
  private is_dragging = false;
  private did_drag = false;  // true if mouse moved while dragging
  private last_canvas_position: Point = Point.zero;  // canvas-relative position
  private on_drag: T_Handle_Drag | null = null;
  private on_wheel: T_Handle_Wheel | null = null;
  private drag_target: Hit_3D_Result | null = null;

  init(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      this.is_dragging = true;
      this.did_drag = false;

      const rect = canvas.getBoundingClientRect();
      const point = new Point(e.clientX - rect.left, e.clientY - rect.top);
      this.last_canvas_position = point;

      const hit = hits_3d.test(point);

      // Store what we're actually dragging (corner/edge/face)
      this.drag_target = hit;

      // Clear hover during drag (especially rotation)
      hits_3d.set_hover(null);

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

    // Drag target must be corner or edge (not face interior)
    if (drag.type === T_Hit_3D.face) return false;

    // Drag target must belong to same SO as selection
    if (drag.so !== sel.so) return false;

    const scene = sel.so.scene;
    if (!scene) return false;

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
    const local = mat4.create();
    const scale_vec = [obj.scale, obj.scale, obj.scale] as [number, number, number];
    mat4.fromRotationTranslationScale(local, obj.so.orientation, obj.position, scale_vec);

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

  // Apply edge drag: affects 1 bound
  // No clamping — bounds can cross (negative dimension = flipped)
  private apply_edge_drag(
    edge_index: number,
    face_index: number,
    so: typeof hits_3d.selection extends { so: infer T } | null ? T : never,
    local_delta: Point3
  ): void {
    const axis = so.edge_changes_axis(edge_index, face_index);
    const bound = so.edge_bound(edge_index, face_index);
    const axis_vec = so.axis_vector(axis);
    const amount = local_delta.dot(axis_vec);

    so.set_bound(bound, so.get_bound(bound) + amount);
  }

  // Apply corner drag: affects 2 bounds
  // No clamping — bounds can cross (negative dimension = flipped)
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
      const amount = local_delta.dot(axis_vec);

      so.set_bound(bound, so.get_bound(bound) + amount);
    }
  }
}

export const e3 = new Events_3D();

import { mat4, vec3, vec4 } from 'gl-matrix';
import { Size } from '../types/Coordinates';

class Camera {
  readonly view: mat4 = mat4.create();
  readonly projection: mat4 = mat4.create();

  private _eye: vec3 = vec3.fromValues(0, 0, 5);
  private center: vec3 = vec3.fromValues(0, 0, 0);
  private up: vec3 = vec3.fromValues(0, 1, 0);

  private fov = Math.PI / 4;
  private _aspect = 1;
  private near = 0.1;
  private far = 100;
  private _size: Size = Size.zero;

  get eye(): vec3 { return this._eye; }

  init(size: Size): void {
    this.resize(size);
    this.update_view();
  }

  resize(size: Size): void {
    this._size = size;
    this._aspect = size.width / size.height;
    this.update_projection();
  }

  set_position(eye: vec3, center?: vec3): void {
    vec3.copy(this._eye, eye);
    if (center) vec3.copy(this.center, center);
    this.update_view();
  }

  set_fov(fov: number): void {
    this.fov = fov;
    this.update_projection();
  }

  // Get ray from camera through screen point (in canvas coordinates)
  // Returns { origin: vec3, direction: vec3 (normalized) }
  screen_to_ray(screen_x: number, screen_y: number): { origin: vec3, dir: vec3 } {
    // Convert screen to NDC (-1 to 1)
    const ndc_x = (screen_x / this._size.width) * 2 - 1;
    const ndc_y = 1 - (screen_y / this._size.height) * 2;  // flip Y

    // Inverse view-projection matrix
    const vp = mat4.create();
    mat4.multiply(vp, this.projection, this.view);
    const inv_vp = mat4.create();
    mat4.invert(inv_vp, vp);

    // Unproject near and far points
    const near_pt = vec4.fromValues(ndc_x, ndc_y, -1, 1);
    const far_pt = vec4.fromValues(ndc_x, ndc_y, 1, 1);

    vec4.transformMat4(near_pt, near_pt, inv_vp);
    vec4.transformMat4(far_pt, far_pt, inv_vp);

    // Perspective divide
    const near_world = vec3.fromValues(
      near_pt[0] / near_pt[3],
      near_pt[1] / near_pt[3],
      near_pt[2] / near_pt[3]
    );
    const far_world = vec3.fromValues(
      far_pt[0] / far_pt[3],
      far_pt[1] / far_pt[3],
      far_pt[2] / far_pt[3]
    );

    // Direction from near to far
    const dir = vec3.create();
    vec3.subtract(dir, far_world, near_world);
    vec3.normalize(dir, dir);

    return { origin: near_world, dir };
  }

  private update_view(): void {
    mat4.lookAt(this.view, this._eye, this.center, this.up);
  }

  private update_projection(): void {
    mat4.perspective(this.projection, this.fov, this._aspect, this.near, this.far);
  }
}

export const camera = new Camera();

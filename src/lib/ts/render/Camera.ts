import { mat4, vec3 } from 'gl-matrix';
import { Size } from '../types/Coordinates';

class Camera {
  readonly view: mat4 = mat4.create();
  readonly projection: mat4 = mat4.create();

  private eye: vec3 = vec3.fromValues(0, 0, 5);
  private center: vec3 = vec3.fromValues(0, 0, 0);
  private up: vec3 = vec3.fromValues(0, 1, 0);

  private fov = Math.PI / 4;
  private aspect = 1;
  private near = 0.1;
  private far = 100;

  init(size: Size): void {
    this.resize(size);
    this.update_view();
  }

  resize(size: Size): void {
    this.aspect = size.width / size.height;
    this.update_projection();
  }

  set_position(eye: vec3, center?: vec3): void {
    vec3.copy(this.eye, eye);
    if (center) vec3.copy(this.center, center);
    this.update_view();
  }

  set_fov(fov: number): void {
    this.fov = fov;
    this.update_projection();
  }

  private update_view(): void {
    mat4.lookAt(this.view, this.eye, this.center, this.up);
  }

  private update_projection(): void {
    mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
  }
}

export const camera = new Camera();

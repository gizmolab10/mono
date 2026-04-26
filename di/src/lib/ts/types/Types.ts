export type Axis_Name = 'x' | 'y' | 'z';
export type Dictionary<T = any> = Record<string, T>;
export type Integer = number & { __brand: 'integer' };
export type Bound = 'x_min' | 'x_max' | 'y_min' | 'y_max' | 'z_min' | 'z_max' | 'width' | 'depth' | 'height';

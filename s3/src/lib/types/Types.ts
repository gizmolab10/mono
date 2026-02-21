export type Dictionary<T = unknown> = Record<string, T>;
export type Integer = number & { __brand: 'integer' };
export type T_Preview_Type = 'image' | 'text' | null;

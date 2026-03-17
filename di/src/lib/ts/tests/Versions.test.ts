import { describe, it, expect } from 'vitest';
import { versions } from '../managers/Versions';

// Minimal SO stub — migrations need at least one entry in smart_objects
const stub_so = { id: 'a', name: 'box', x: { attributes: {} }, y: { attributes: {} }, z: { attributes: {} } };

describe('v8 → v9: constants → givens', () => {

	it('renames constants to givens', () => {
		const scene = versions.migrate({
			smart_objects: [stub_so],
			constants: [{ name: 'gap', value_mm: 25.4 }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '8');
		expect(scene.givens).toEqual([{ name: 'gap', value_mm: 25.4 }]);
		expect((scene as any).constants).toBeUndefined();
	});

	it('handles missing constants gracefully', () => {
		const scene = versions.migrate({
			smart_objects: [stub_so],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '8');
		expect(scene.givens).toBeUndefined();
	});

	it('chains v5 standard_dimensions → constants → givens', () => {
		const scene = versions.migrate({
			smart_objects: [stub_so],
			standard_dimensions: [{ name: 'depth', value_mm: 400 }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '5');
		expect(scene.givens).toEqual([{ name: 'depth', value_mm: 400 }]);
		expect((scene as any).constants).toBeUndefined();
		expect((scene as any).standard_dimensions).toBeUndefined();
	});
});

describe('underscores → spaces (idempotent, all versions)', () => {

	it('replaces underscores with spaces in SO names', () => {
		const scene = versions.migrate({
			smart_objects: [{ id: 'a', name: 'bottom_drawer', x: { attributes: {} }, y: { attributes: {} }, z: { attributes: {} } }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '9');
		expect(scene.smart_objects[0].name).toBe('bottom drawer');
	});

	it('replaces underscores with spaces in formula strings', () => {
		const scene = versions.migrate({
			smart_objects: [{
				id: 'a', name: 'box',
				x: { attributes: { origin: { value: 0, formula: 'bottom_drawer.e + 3' }, extent: 100, length: 100, angle: 0 } },
				y: { attributes: {} },
				z: { attributes: {} },
			}],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '9');
		expect((scene.smart_objects[0].x.attributes.origin as any).formula).toBe('bottom drawer.e + 3');
	});

	it('replaces underscores with spaces in given names', () => {
		const scene = versions.migrate({
			smart_objects: [stub_so],
			givens: [{ name: 'shelf_gap', value_mm: 25.4 }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '9');
		expect(scene.givens![0].name).toBe('shelf gap');
	});

	it('handles names without underscores', () => {
		const scene = versions.migrate({
			smart_objects: [{ id: 'a', name: 'box', x: { attributes: {} }, y: { attributes: {} }, z: { attributes: {} } }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '9');
		expect(scene.smart_objects[0].name).toBe('box');
	});

	it('v8 data gets both givens rename and underscore migration', () => {
		const scene = versions.migrate({
			smart_objects: [{ id: 'a', name: 'top_drawer', x: { attributes: {} }, y: { attributes: {} }, z: { attributes: {} } }],
			constants: [{ name: 'shelf_gap', value_mm: 10 }],
			root_id: 'a',
			camera: { eye: [0, 0, 0], center: [0, 0, 0], up: [0, 1, 0] },
		}, '8');
		expect(scene.smart_objects[0].name).toBe('top drawer');
		expect(scene.givens![0].name).toBe('shelf gap');
		expect((scene as any).constants).toBeUndefined();
	});
});

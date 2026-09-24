import { describe, it, expect } from 'vitest';
import { placement_crosses_placed } from '../render/Dimension_Placement';

type Seg = [{ x: number; y: number }, { x: number; y: number }];

// Spec 7 reuse cross-check: a reused placement may not keep its label over
// another placement's witness line, nor its own witness over another's label.
// placement_crosses_placed returns true when either crossing is within the gap.
describe('placement_crosses_placed', () => {
	const label = { x_min: 100, x_max: 120, y_min: 100, y_max: 110 };
	// One own witness line: a vertical segment at x = 50, y from 50 to 90.
	const own_witnesses: Seg[] = [[{ x: 50, y: 50 }, { x: 50, y: 90 }]];

	it('true when the label crosses a kept witness line', () => {
		const kept_witness: Seg[] = [[{ x: 105, y: 90 }, { x: 105, y: 130 }]];  // runs through the label
		expect(placement_crosses_placed(label, own_witnesses, [], kept_witness, 5)).toBe(true);
	});

	it('true when an own witness crosses a kept label rectangle', () => {
		const kept_label = [{ x_min: 45, x_max: 55, y_min: 60, y_max: 80 }];  // own witness x=50 runs through it
		expect(placement_crosses_placed(label, own_witnesses, kept_label, [], 5)).toBe(true);
	});

	it('false when label and witnesses clear everything kept', () => {
		const kept_label = [{ x_min: 300, x_max: 320, y_min: 300, y_max: 310 }];
		const kept_witness: Seg[] = [[{ x: 400, y: 400 }, { x: 400, y: 450 }]];
		expect(placement_crosses_placed(label, own_witnesses, kept_label, kept_witness, 5)).toBe(false);
	});

	it('false when nothing has been kept yet', () => {
		expect(placement_crosses_placed(label, own_witnesses, [], [], 5)).toBe(false);
	});
});

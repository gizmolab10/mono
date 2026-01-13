import { colors } from '../utilities/Colors';

describe('darkness', () => {
	it('666', () => {
		const color = colors.set_darkness_toColor('#666', 0.2);
		expect(color).toBe('#e7e7e7');
	});
	it('red', () => {
		const color = colors.set_darkness_toColor('red', 0.2);
		expect(color).toBe('#ff0000');
	});
});

describe('saturation', () => {
	it('red', () => {
		const color = colors.multiply_saturationOf_by('red', 0.2);
		expect(color).toBe('#ffcccc');
	});
	it('blue', () => {
		const color = colors.multiply_saturationOf_by('blue', 0.2);
		expect(color).toBe('#ccccff');
	});
	it('green', () => {
		const color = colors.multiply_saturationOf_by('green', 0.2);
		expect(color).toBe('#668066');
	});
});

describe('luminance', () => {
	it('666', () => {
		const luminance = colors.luminance_ofColor('#666');
		expect(luminance).toBe(0.13286832155381795);
	});
	it('888', () => {
		const luminance = colors.luminance_ofColor('#888');
		expect(luminance).toBe(0.24620132670783546);
	});
	it('000', () => {
		const luminance = colors.luminance_ofColor('#000');
		expect(luminance).toBe(0);
	});
	it('fff', () => {
		const luminance = colors.luminance_ofColor('#fff');
		expect(luminance).toBe(1);
	});
	it('FFA500', () => {
		const luminance = colors.luminance_ofColor('#FFA500');
		expect(luminance).toBe(0.4817026703630963);
	});
});

describe('names', () => {
	it('red', () => {
		const color = colors.color_toHex('red');
		expect(color).toBe('#ff0000');
	});
	it('limegreen', () => {
		const color = colors.color_toHex('limegreen');
		expect(color).toBe('#32cd32');
	});
	it('blue', () => {
		const color = colors.color_toHex('blue');
		expect(color).toBe('#0000ff');
	});
	it('blue', () => {
		const luminance = colors.luminance_ofColor('blue');
		expect(luminance).toBe(0.0722);
	});
	it('green', () => {
		const luminance = colors.luminance_ofColor('green');
		expect(luminance).toBe(0.1543834296814607);
	});
	it('yellow', () => {
		const luminance = colors.luminance_ofColor('yellow');
		expect(luminance).toBe(0.9278);
	});
	it('red', () => {
		const luminance = colors.luminance_ofColor('red');
		expect(luminance).toBe(0.2126);
	});
});


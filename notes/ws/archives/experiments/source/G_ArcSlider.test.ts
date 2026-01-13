import { G_ArcSlider } from '../src/lib/ts/common/Global_Imports';

export class ArcSliderTester {
    private slider: G_ArcSlider;
    private container: HTMLElement;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) || document.body;
        this.slider = new G_ArcSlider();
    }

    testPath(props: {
        startAngle: number;
        endAngle: number;
        insideRadius: number;
        outsideRadius: number;
        centerX: number;
        centerY: number;
    }) {
        this.slider.start_angle = props.startAngle;
        this.slider.end_angle = props.endAngle;
        this.slider.inside_arc_radius = props.insideRadius;
        this.slider.outside_arc_radius = props.outsideRadius;
        this.slider.clusters_center.x = props.centerX;
        this.slider.clusters_center.y = props.centerY;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '400');
        svg.setAttribute('height', '400');
        svg.style.border = '1px solid black';

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', this.slider.svgPathFor_arcSlider);
        path.setAttribute('fill', '#ffeee3');
        path.setAttribute('stroke', '#e6d4e6');
        path.setAttribute('stroke-width', '2.5');

        svg.appendChild(path);
        this.container.appendChild(svg);

        // Add test info
        const info = document.createElement('div');
        info.innerHTML = `
            <p>Start: ${props.startAngle.toFixed(2)}</p>
            <p>End: ${props.endAngle.toFixed(2)}</p>
            <p>Inside: ${props.insideRadius}</p>
            <p>Outside: ${props.outsideRadius}</p>
            <p>Center: (${props.centerX}, ${props.centerY})</p>
        `;
        this.container.appendChild(info);
    }

    testAll() {
        const tests = [
            // Basic arc
            { startAngle: 0, endAngle: Math.PI/2, insideRadius: 50, outsideRadius: 100, centerX: 200, centerY: 200 },
            // Full circle
            { startAngle: 0, endAngle: Math.PI*2, insideRadius: 50, outsideRadius: 100, centerX: 200, centerY: 200 },
            // Small arc
            { startAngle: Math.PI/4, endAngle: Math.PI/3, insideRadius: 50, outsideRadius: 100, centerX: 200, centerY: 200 },
            // Different center
            { startAngle: 0, endAngle: Math.PI, insideRadius: 50, outsideRadius: 100, centerX: 100, centerY: 100 },
            // Different radii
            { startAngle: 0, endAngle: Math.PI, insideRadius: 30, outsideRadius: 150, centerX: 200, centerY: 200 }
        ];

        tests.forEach(test => {
            this.testPath(test);
            this.container.appendChild(document.createElement('hr'));
        });
    }
} 
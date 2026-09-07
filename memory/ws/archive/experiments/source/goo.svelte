<script lang="ts">
    import { Point } from './src/lib/ts/types/Geometry';
    import './src/lib/ts/common/Extensions';

    // Parameters
    let startAngle = Math.PI * 1.8;
    let endAngle = startAngle - Math.PI * 0.2;
    let innerRadius = 100;
    let outerRadius = 140;
    let thickness = (outerRadius - innerRadius);

    while (endAngle < startAngle) {
        endAngle += Math.PI * 2;
    }

    // Points using Point.polarTo
    $: outerStart = Point.polarTo(startAngle, outerRadius);
    $: outerEnd = Point.polarTo(endAngle, outerRadius);
    $: innerEnd = Point.polarTo(endAngle, innerRadius);
    $: innerStart = Point.polarTo(startAngle, innerRadius);

    // Large arc flag
    $: arcSweep = (endAngle - startAngle) <= Math.PI ? 0 : 1;

    // Path for the bean
    $: beanPath = `
        M ${outerStart.x} ${outerStart.y}
        A ${outerRadius} ${outerRadius} 0 ${arcSweep} 1 ${outerEnd.x} ${outerEnd.y}
        A ${thickness/2} ${thickness/2} 0 0 1 ${innerEnd.x} ${innerEnd.y}
        A ${innerRadius} ${innerRadius} 0 ${arcSweep} 0 ${innerStart.x} ${innerStart.y}
        A ${thickness/2} ${thickness/2} 0 0 1 ${outerStart.x} ${outerStart.y}
        Z
    `;
</script>

<main>
    <svg width="400" height="400" viewBox="0 0 400 400">
        <g transform="translate(200,200)">
            <path 
                d={beanPath}
                fill="#b3cbe6"
                stroke="#99b8d8"
                stroke-width="5"
            />
            <circle cx="0" cy="0" r="12" fill="#9b6b8e" />
        </g>
    </svg>
</main> 
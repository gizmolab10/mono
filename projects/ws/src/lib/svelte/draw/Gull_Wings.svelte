<script lang='ts'>
    import { k, Point, Angle, T_Layer, Direction, svgPaths } from '../../ts/common/Global_Imports';
    export let radius = k.radius.gull_wings.ultra_thin;
    export let direction = Direction.down;
    export let zindex = T_Layer.line;
    export let center = Point.zero;
    export let color = 'black';
    export let thickness = 1;
    const cx = 0;
    const cy = 0;
    const baseAngle = direction + Angle.half;
    const leftEndAngle = baseAngle + Angle.quarter;
    const rightEndAngle = baseAngle - Angle.quarter;
    const a_start = Point.fromPolar(radius, leftEndAngle);
    const a_end = Point.fromPolar(radius, baseAngle);
    const b_end = Point.fromPolar(radius, rightEndAngle);
    const minX = Math.min(a_start.x, a_end.x, b_end.x);
    const maxX = Math.max(a_start.x, a_end.x, b_end.x);
    const minY = Math.min(a_start.y, a_end.y, b_end.y);
    const maxY = Math.max(a_start.y, a_end.y, b_end.y);
    const width = maxX - minX;
    const height = maxY - minY;
    const svgTop = center.y + minY;
    const svgLeft = center.x + minX;
    let gullWingsPath = svgPaths.gull_wings(Point.zero, radius, direction);
</script>

<svg
    style='
        z-index: {zindex};
        position: absolute;
        pointer-events: none;
        top: {svgTop}px;
        left: {svgLeft}px;'
    class='gull-wings'
    width={width}
    height={height}
    viewBox={`${minX} ${minY} ${width} ${height}`}> 
    <path 
        fill={color}
        stroke={color}
        d={gullWingsPath}
        stroke-width={thickness}/>
</svg>

# Utilities Design Spec — ws

Source files under `ws/src/lib/ts/`.

---

## SVG_Paths.ts

`utilities/SVG_Paths.ts` — singleton exported as `svgPaths`.

All methods return SVG path `d` attribute strings unless noted otherwise.

### Line methods

**`line_connecting(start: Point, end: Point)`**
Straight line: `M ${start.x} ${start.y} L ${end.x} ${end.y}`.

**`line_atAngle(start: Point, radius: number, angle: number)`**
Calls `Point.fromPolar(radius, angle).offsetBy(start)` to find the endpoint, then delegates to `line_connecting`. Produces a line of fixed length at a given angle from a starting point.

**`line(vector: Point, offset: Point = Point.zero)`**
Produces a line segment for a vector that may have negative components. Handles all four sign combinations so the path stays inside positive SVG coordinate space:
- x≥0, y≥0: `M offset.x offset.y L x y`
- x≥0, y<0: `M offset.x -y L x offset.y`
- x<0, y≥0: `M -x offset.y L offset.x y`
- x<0, y<0: `M -x -y L offset.x offset.y`

### Primitive shapes

**`rectangle(rect: Rect)`**
Closed four-corner polygon using `M/L/Z`: top-left → top-right → bottom-right → bottom-left → close.

**`dash(diameter: number, margin: number)`**
Horizontal dash at vertical center: `M${margin} ${diameter/2} L${diameter - margin} ${diameter/2}`.

**`x_cross(diameter: number, margin: number)`**
Two diagonal lines crossing. `start = margin + 2`, `end = diameter - start`. Draws `\` then `/` diagonals.

**`t_cross(diameter: number, margin: number)`**
Plus-sign cross. Horizontal arm: `start` to `end` at y=`radius`. Vertical arm: `start` to `end` at x=`radius`. Uses `start = margin + 2`, `end = diameter - margin - 2`, `radius = diameter / 2`.

### Circles and ovals

**`circle(center: Point, radius: number, clockwise: boolean = true)`**
Full circle as two 180° arcs (SVG cannot represent a full circle as a single arc). Uses relative `a` commands:
- `direction = clockwise ? 0 : 1`
- `diametric_move = radius * 2 * (clockwise ? 1 : -1)`
- Path: `M${cx - r} ${cy} a r r 0 0 direction diametric_move 0 a r r 0 0 direction -diametric_move 0`

**`circle_atOffset(width: number, diameter: number, offset: Point = Point.zero)`**
Centers a circle within a box of `width`. Computes `center = offset.offsetEquallyBy(width / 2)` then calls `circle(center, diameter / 2)`.

**`oval(diameter: number, horizontal: boolean = true, eccentricity: number = 2.3)`**
Ellipse using two 180° arc commands. Radii differ by `eccentricity`:
- `radius = diameter / 2`
- `width = radius - (horizontal ? 1 : eccentricity)`
- `height = radius - (horizontal ? eccentricity : 1)`
- Path: `M${r-w} ${r} a w h 0 1 0 2w 0 a w h 0 1 0 -2w 0`

**`annulus(center: Point, outer_radius: number, thickness: number, offset: Point = Point.zero)`**
Ring/donut shape. Combines:
1. Clockwise outer circle at `offset_center`
2. Counter-clockwise inner circle at `inner_center = offset_center.offsetByX(center.x * 2)` with radius `outer_radius - thickness`
SVG fill-rule makes the inner circle subtract from the outer.

### Arcs

**`arc(center: Point, radius: number, sweepFlag: number, startAngle: number, endAngle: number)`**
Full arc with explicit start and end angles. Uses `Point.fromPolar` to compute start and end coordinates. `largeArcFlag` computed as `1` if the normalized angle span `(startAngle - endAngle).angle_normalized() > Math.PI`, else `0`. Returns multiline path string with `M` then `A`.

**`arc_partial(center: Point, radius: number, largeArcFlag: number, sweepFlag: number, endAngle: number)`**
Arc continuation (no `M` command). Computes only the `A` command to the end point. Used to chain arc segments.

**`startOutAt(center: Point, radius: number, startAngle: number)`**
Returns only a `M` command to the polar-offset start point. Used to begin a sequence of `arc_partial` calls.

**`half_circle(diameter: number, direction: number)`**
Semicircle in one of four directions (uses `Direction` enum).
- Vertical (`up`/`down`): moves to the left or right midpoint, draws arc to center-top or center-bottom.
- Horizontal (`right`/`left`): moves to top or bottom midpoint, draws arc to center-right or center-left.
All arcs use `0 0 1` (small arc, clockwise sweep).

### Decorative / graph-specific shapes

**`fillets(center: Point, radius: number, direction: Direction)`**
Three-point arc shape used for decorative fillet connectors. Math:
- `baseAngle = direction + Angle.half`
- `leftEndAngle = baseAngle + Angle.quarter`
- `rightEndAngle = baseAngle - Angle.quarter`
Draws two 90° counter-clockwise arcs (flag `0 0 0`) from leftEnd through base to rightEnd, then closes back to leftEnd. Creates a concave triangular arc form pointing in `direction`.

**`polygon(radius: number, angle: number, count: number = 3, skip: Array<number>)`**
Regular polygon. Calls `u.polygonPoints(radius, count, angle)` to get vertices. Iterates in reverse from `count-1` to `0`, skipping indices in `skip`. Builds `M x y L x y ... Z` path. Center is `Point.square(radius)`.

**`fat_polygon(size: number, angle: number, onCenter: boolean = false, vertices: number = 3)`**
Rounded "fat" triangle (default 3 vertices). For each vertex computes:
- `final = angle + i * (2π/vertices)` — the vertex angle
- `halfWay = final - π/vertices` — midpoint between vertices
- `preceder = halfWay - tweak`, `follower = halfWay + tweak` where `tweak = π/(vertices*5)`
- Control points at `outer = size/2` radius; end points at `inner = size/3` radius
Produces cubic Bezier curves (`C`) between consecutive points. Used for reveal dots (fat triangles pointing in a direction).

**`fat_polygon_path_for(name: string, size: number = 16)`**
Looks up an angle from a name string via `Angle.angle_from_name(name)`. Returns `fat_polygon(size, angle)` or `null` if name not recognized.

**`arrow_forTitle(diameter: number, margin: number, title: string)`**
Parses orientation from `title` via `Angle.orientation_from_name`. Returns `k.empty` if not recognized, else delegates to `arrow_forOrientation`.

**`arrow_forOrientation(diameter: number, margin: number, orientation: T_Orientation)`**
Solid arrow polygon (7 points closed with `Z`). Computes:
- `available = diameter - margin * 2`
- `arrowheadBase = available` (full available height)
- `arrowheadLength = available * 2/3`
- `bodyWidth = available * 0.3`
Produces four variants for `right`, `left`, `up`, `down` orientations, each a different rotation of the same proportioned shape.

**`oblong(center: Point, size: Size, part: T_Oblong = T_Oblong.full)`**
Pill/stadium-like shape with flat or rounded ends. `radius = size.height / 2`.
- `T_Oblong.middle`: plain rectangle (no arcs)
- `T_Oblong.right`: flat left end, semicircle right cap
- `T_Oblong.left`: semicircle left cap, flat right end
- `T_Oblong.full`: semicircle caps on both ends
All use `A radius radius 0 0 1` (small arc, clockwise). `L` and `R` edge positions adjust by `radius` depending on which caps are active.

**`pill(center: Point, size: Size)`**
Similar to `oblong(full)` but with a slightly different coordinate layout. `half = size.width / 2`. Left edge = `cx - half`, right edge = `cx + half`. Semicircle caps on both sides.

**`hamburgerPath(size: number = 150)`**
Three horizontal pills forming a hamburger icon. Each bar is `size/5` tall. Positions at `y = barHeight/2`, `size/2`, `size - barHeight/2`. Calls `pill` three times and joins with `k.space`.

**`ellipses(stretch: number, tiny: number, horizontal: boolean = true, count: number = 3, other: number = 6)`**
Three or more small ellipses (like a "..." indicator). Capped at `max = Math.min(4, count)`. Evenly spaces ellipses across `stretch`, each of radius `tiny`, center at `other` on the perpendicular axis. Each ellipse is two half-arc pairs (`0 1 1` sweep). Returns joined path strings.

### Tiny outer dots (child count indicator)

**`tiny_outer_dots_circular(diameter: number, count: Integer, points_right: boolean)`**
Main entry point. Decomposes `count` into thousands, hundreds, tens, ones digits. Assigns dot sizes by magnitude:
- `small = 1.5` (ones)
- `big = small * 1.3` (tens)
- `huge = big * 1.3` (hundreds)
- `gigantic = huge * 1.3` (thousands)
Renders two half-circles when two digit groups are active (one on each hemisphere); full circle when only one group. Delegates to `tiny_outer_dots_halfCircular` and `tiny_outer_dots_fullCircular`.

**`tiny_outer_dots_fullCircular(diameter: number, count: Integer, points_right: boolean, dot_size: number = 2)`**
Evenly spaces `count` dots around a full circle at `radius = diameter / 3`. Increment = `2π / count`. Starting radial = `Point.x(radius)` rotated by `0` (right) or `π` (left). Delegates to `tiny_outer_dots_path`.

**`tiny_outer_dots_halfCircular(diameter: number, count: Integer, points_right: boolean, dot_size: number, isBig: boolean = false)`**
Evenly spaces `count` dots across a semicircle. Increment = `π / count`. Starting radial = `Point.y(±radius)` (sign determined by `isBig == points_right`), pre-rotated by `increment / 2` to center the arc. Delegates to `tiny_outer_dots_path`.

**`tiny_outer_dots_path(diameter: number, dot_size: number, increment: number, count: Integer, radial: Point)`**
Core loop. For each of `count` iterations, calls `circle_atOffset(diameter, dot_size, radial.offsetByXY(-0.7, 0.3))` and rotates `radial` by `increment`. Returns concatenated circle path strings.

### Hit testing and path analysis

**`isPointInPath(point: Point | null, pathElement: SVGPathElement | null)`**
Tests whether a screen-space point is inside an SVG path's fill area. Process:
1. Gets `ownerSVGElement` from the path element.
2. Creates an SVG point, assigns screen coordinates.
3. Gets the screen CTM via `getScreenCTM()`, inverts it, transforms the point.
4. Calls native `pathElement.isPointInFill(new DOMPoint(...))`.
Returns `false` if any step fails.

**`sizeFrom_svgPath(svgPath: string)`**
Debug utility. Parses an SVG path string to compute its bounding box `Size`. Handles commands: `M`, `L`, `H`, `V`, `A` (absolute arc — includes full arc bounding box math with CTM decomposition), `Z`. Arc handling:
- Corrects radii if too small via `radiiCheck`
- Decomposes arc to find center `(cx, cy)`
- Expands bounding box by `cx ± rx`, `cy ± ry`
Returns `new Size(maxX - minX, maxY - minY)`.

### Static path

**`get hammer`**
Hard-coded path string for a clock/watch icon. 24×24 viewport. Includes circular clock face arc, clock hands, and decorative dots.

---

## Colors.ts

`utilities/Colors.ts` — singleton exported as `colors`.

### Svelte stores

| Store | Type | Initial value | Purpose |
|---|---|---|---|
| `w_background_color` | `writable<string>` | undefined | Current background color |
| `w_thing_color` | `writable<string \| null>` | `null` | Current thing (node) color |
| `w_separator_color` | `writable<string>` | `'#eeeee0'` | Separator line color |
| `w_color_picker_isOpen` | `writable<boolean>` | — | Whether color picker UI is open |

### Plain color fields

| Field | Value |
|---|---|
| `default` | `'black'` |
| `banner` | `'#f8f8f8'` |
| `border` | `'darkgray'` |
| `background` | `'white'` |
| `separator` | `'#eeeee0'` |
| `disabled` | `'lightGray'` |
| `rubberband` | `'#4a90e2'` |
| `graph_background` | `'white'` |
| `default_forThings` | `'blue'` |
| `thin_separator_line_color` | `'#999999'` |

### `restore_preferences()`

Called at startup. Reads `T_Preference.background` and `T_Preference.separator` from persistent preferences store `p`.

Subscriptions set up:
- `w_separator_color` changes → writes to prefs, recalculates and sets `w_background_color` via `ofBackgroundFor`.
- `w_background_color` changes → sets `--css-background-color` CSS variable on `document.documentElement`, writes to prefs, updates `this.banner` via `ofBannerFor`.

### Derived color computations

**`ofBackgroundFor(color: string)`**
Returns `lighterBy(color, 10)`. Background is 10 units lighter than the separator.

**`ofBannerFor(background: string)`**
Returns `blend('white', background, 4)`. Banner blends white with background at saturation multiplier 4.

**`opacitize(color: string, amount: number)`**
Returns `transparentize(color, 1 - amount)` from `color2k`. Returns `''` if input is `''`.

**`background_special_blend(color: string, opacity: number)`**
Calls `special_blend(color, get(w_background_color), opacity)`. Falls back to `color` on failure.

**`color_fromSeriously(color: string | undefined)`**
Parses a "WebSeriously" serialized color string formatted as `"red:0.7,green:0,blue:0,alpha:1"`. Splits on `,` then `:`, maps to `RGBA` with `Math.round(value * 255)`. Converts to hex. Falls back to `default_forThings` if input is falsy.

### Blend methods

**`blend(color: string, background: string, saturation: number = 7)`**
Computes a "blended" separator-like color:
- If `background` equals `this.background` (white): returns `'lightgray'`.
- If `background` is gray (R==G==B): returns `darkerBy(background, 1/saturation)`.
- Otherwise: returns `multiply_saturationOf_by(background, saturation)`.
If `blended` is non-null, replaces `color`. Returns the result.

**`special_blend(color: string, background: string, ratio: number)`**
Alpha-composites two colors with a ratio:
- Parses both to RGBA.
- Computes `alpha = rgbaA.a * ratio`.
- Blends channels: `r = round(rgbaA.r * alpha + rgbaB.r * (1 - alpha))` (and same for g, b).
- Converts result to hex, then multiplies its saturation by `1 + ratio`.
Returns `null` if either parse fails.

### Luminance methods

**`luminance_ofColor(color: string)`**
Parses to RGBA, delegates to `luminance_ofRGBA`. Returns `0` on failure.

**`luminance_ofRGBA(rgba: RGBA)` (private)**
WCAG relative luminance formula:
1. Linearizes each channel: `s <= 0.04045 ? s/12.92 : ((s+0.055)/1.055)^2.4`
2. Relative luminance `Y = 0.2126*R + 0.7152*G + 0.0722*B`
3. Adjusts for alpha: `luminance = a * Y + (1 - a) * 1` (assumes white background)

**`darkerBy(color: string, ratio: number)`**
Adjusts darkness using closure `lume => (1 - lume) * (1 + ratio)`.

**`lighterBy(color: string, ratio: number)`**
Adjusts darkness using closure `lume => Math.max(0, (1 - lume) / ratio)`.

**`luminance_driven_desaturation(color: string)`**
If `luminance > 0.5`: blends with black. Otherwise blends with itself. Returns modified color.

**`adjust_luminance_byApplying(color: string, closure)` (private)**
Parses to RGBA, gets luminance, applies closure to get target darkness, calls `set_darkness_toRGBA`.

### Darkness adjustment

**`adjust_RGBA_forDarkness(rgba: RGBA, targetDarkness: number)` (private)**
Full photometric adjustment preserving hue/saturation:
- Darkness defined as `1 - (a * Y + (1-a) * 1)`.
- Target luminance: `Y_new = (a - targetDarkness) / a`.
- Scaling factor: `k = Y_new / Y`.
- Scales each linear-space channel by `k` (clamped to 1), converts back to sRGB.
- Returns `{result, error}`. Errors for: zero alpha with non-zero target, target > alpha, black color with non-zero target, out-of-range target luminance.

### Saturation methods

**`multiply_saturationOf_by(color: string, ratio: number)` (private)**
Converts to HSBA, multiplies `s` by `ratio` (capped at 255), converts back to hex.

### Color space conversions (all private)

**`color_toRGBA(color: string)`**
Uses `parseToRgba` from `color2k`. Returns `new RGBA(r, g, b, a)` or `null` on error.

**`color_toHSBA(color: string)`**
Parses to RGBA then calls `RBGA_toHSBA`.

**`color_toHex(color: string)`**
Parses to RGBA, converts back to hex.

**`RGBA_toHex(rgba: RGBA, omitAlpha: boolean = true)`**
Converts RGBA to `#rrggbb` (or `#rrggbbaa` if `omitAlpha=false`). Clamps all channels to valid ranges before conversion.

**`HSBA_toRGBA(hsba: HSBA)`**
HSB to RGB conversion via chroma method:
- `c = b * s`, `x = c * (1 - |(h/60) mod 2 - 1|)`, `m = b - c`
- Maps hue sector (0-60, 60-120, ..., 300-360) to raw rgb
- Adds `m`, scales to 255, rounds.

**`RBGA_toHSBA(rgba: RGBA)`**
RGB to HSB:
- Normalizes channels to [0,1].
- `max`, `min`, `delta` of channels.
- Hue computed from which channel is max, normalized to [0,360).
- `s = (delta / max) * 100`, `b = max * 100`.

**`isGray(color: string)` (private)**
Returns `true` if `r === g === g === b` in RGBA.

**`colors_areIdentical(a, b)` (private)**
Converts both to hex, compares.

### Internal value classes

**`RGBA`**: fields `r`, `g`, `b` (0–255), `a` (0–1). Constructor defaults all to `0`.

**`HSBA`**: fields `h` (0–360), `s` (0–100), `b` (0–100), `a` (0–1). Constructor defaults all to `0`.

---

## Utilities.ts

`utilities/Utilities.ts` — class `Utilities extends Testworthy_Utilities`. Singleton exported as `u`.

Imports from managers, geometry, database — not safe to import in test code (unlike `Testworthy_Utilities`).

### Ancestry description methods

**`descriptionBy_title(ancestries: Array<Ancestry> | null)`**
Maps each ancestry to its `title` (or `k.unknown` if null), joins with `'-'`. Returns `k.empty` if `ancestries` is null.

**`descriptionBy_titles(ancestries: Array<Ancestry> | null)`**
Maps each ancestry to its `titles` array (joined with `k.comma`), then joins results with `'-'`. Returns `k.unknown` if null.

**`descriptionBy_sorted_HIDs(identifiables: Array<Identifiable>)`**
Maps to `hid` values (defaulting to `-1`), sorts numerically, joins with `k.comma`.

**`descriptionBy_sorted_IDs(identifiables: Array<Identifiable>)`**
Maps to `id` values (defaulting to `k.unknown`), sorts, joins with `k.comma`.

### Sorting

**`sort_byOrder(ancestries: Array<Ancestry>)`**
Sorts by `ancestry.order` ascending. Mutates and returns the array.

**`sort_byTitleTop(ancestries: Array<Ancestry>)`**
Sorts by `rect_ofTitle.origin.y` (top of title rect). Nulls sort as equal (return 0).

### ID and database

**`ids_forDB(ancestries: Array<Ancestry>)`**
Filters to ancestries matching the current database (`databases.w_t_database`). Maps to `id`. Used to get IDs relevant to the active DB.

### Duplicate stripping

**`strip_hidDuplicates(ancestries: Array<Ancestry>)`**
Deduplicates by `hid`. Builds a record keyed by hid; first occurrence wins. Preserves order of first appearance.

**`strip_identifiableDuplicates(identifiables: Array<Identifiable>)`**
Similar to above but for `Identifiable` objects. When a duplicate hid is found, keeps the one with higher `hid` value (assures repeatability of array content).

**`strip_thingDuplicates_from(ancestries: Array<Ancestry>)`**
Deduplicates by `ancestry.thing.hid`. When duplicate found, keeps the ancestry with greater `depth`.

### Ancestry index lookup

**`indexOf_withMatchingThingID_in(ancestry: Ancestry, ancestries: Array<Ancestry>)`**
Finds the first ancestry in `ancestries` whose `thing.id` matches `ancestry.thing.id`. Returns `-1` if `ancestry.thing` is null or no match.

### Ancestry order normalization

**`ancestries_orders_normalize(ancestries: Array<Ancestry>)`**
Sorts by order, then reassigns `order` values as sequential integers `0..length-1`. No-op if length ≤ 1. Uses `ancestry.order_setTo(index)` to persist.

### Bidirectional matching

**`hasMatching_bidirectional(bidirectionals: G_TreeLine[], g_line: G_TreeLine)`**
Returns `true` if any line in `bidirectionals` has the same pair of ancestry IDs as `g_line` in either direction (A→B or B→A).

### Width measurement

**`getWidthOf(s: string)`**
Returns `getWidth_ofString_withSize(s, '${k.font_size.common}px')`. Uses the common font size.

**`getWidth_ofString_withSize(str: string, fontSize: string)`**
DOM-based text measurement:
1. Creates an offscreen `div` at `left: -9999px`.
2. Sets font family from `x.w_thing_fontFamily`, font size from parameter.
3. Sets `white-space: pre` to preserve spacing.
4. Appends to body, reads `getBoundingClientRect().width`.
5. Divides by `g.w_scale_factor`.
6. Removes element. Returns width.

**`getFontOf(element: HTMLElement)`**
Gets computed `fontSize` and `fontFamily` from an element. Returns `'${fontSize} ${fontFamily}'`.

### Text input helpers

**`convert_windowOffset_toCharacterOffset_in(offset: number, input: HTMLInputElement)`**
Maps a window x-coordinate to a character index within an input field. Process:
1. Computes `contentLeft = rect.left + borderLeft + paddingLeft`.
2. `relativeX = offset - contentLeft` (clamped to 0).
3. `effectiveX = (relativeX + input.scrollLeft) / scale_factor`.
4. Binary search on `context.measureText(text.substring(0, mid)).width` to find character boundary.
5. Checks adjacent character to pick the closer boundary.

### Signal value resolution

**`resolve_signal_value(value: any)`**
For display/debug: if primitive, returns as-is. If `Ancestry`, returns `'Ancestry (title)'`. Otherwise returns constructor name or `'null'`.

### Printing

**`print_graph()`**
Reads `g.rect_ofAllWidgets`. Gets class name `'tree-graph'` or `'radial-graph'` based on `show.inTreeMode`. Calls `print.print_element_byClassName_withRect`.

**`temporarily_setDefaults_while(closure: () => void)`**
Resets UI state temporarily for clean printing/export:
1. Saves current grabs and grab index from `x.si_recents`.
2. Sets background to white.
3. Clears grabs.
4. After 10ms timeout: calls closure, restores grabs and original background.

**`print_element_byClassName_withRect(className: string, rect: Rect, title: string)`**
Opens a new browser window, writes a minimal HTML document containing `element.outerHTML`, triggers `window.print()`, closes. Note: `link` for stylesheet points to `'/path/to/your/styles.css'` (placeholder).

### Layout

**`get_rect_ofGraphDrawing_forAll_g_widgets(g_widgets: G_Widget[])`**
Computes bounding `Rect` across all widgets. For each widget:
- `origin = g_widget.origin_ofGraphDrawing`
- `height = k.height.row - 1.5`
- `width = g_widget.width_ofWidget`
Returns `Rect.zero` if empty array.

---

## Testworthy_Utilities.ts

`utilities/Testworthy_Utilities.ts` — class `Testworthy_Utilities`. Singleton exported as `tu`. Superclass of `Utilities`. Safe to import in Vitest test files (no DOM/manager dependencies).

Private `orderedKeysCache = new WeakMap<object, string[]>()` for memoizing key order of dictionaries.

### Event utilities

**`ignore(event: Event)`** — No-op. Used to suppress event handlers.

**`consume_event(event: Event)`** — Calls `preventDefault()` and `stopPropagation()`.

**`location_ofMouseEvent(event: MouseEvent)`** — Returns `new Point(event.clientX, event.clientY)`.

### Boolean/display

**`t_or_f(value: boolean)`** — Returns `'|'` for true, `'-'` for false. Used in debug display.

**`quadrant_ofAngle(angle: number)`** — Returns `new Angle(angle).quadrant_ofAngle`. Wraps the `Angle` type's quadrant computation.

**`basis_angle_ofType_Quadrant(quadrant: T_Quadrant)`**
Maps quadrant to a basis angle:
- `upperRight` → `Angle.three_quarters`
- `lowerLeft` → `Angle.quarter`
- `upperLeft` → `Angle.half`
- default → `0`

### Dictionary/index access

**`valueFrom_atIndex<T extends Record<string, number>>(dictionary: T, index: number)`**
Gets a value by positional index from a string-keyed dictionary. Uses `Object.keys()` — key order not guaranteed to be stable across calls. Throws if index out of bounds.

**`valueFrom_atIndex_usingMap<T extends Record<string, number>>(dictionary: T, index: number)`**
Same as above but caches the key order in `orderedKeysCache` (WeakMap). Stable across calls for the same object reference.

### Generic array operations

**`concatenateArrays(a, b)`** — Spread concat: `[...a, ...b]`.

**`strip_falsies(array)`** — `array.filter(a => !!a)`. Removes nulls, undefineds, empty strings, 0, false.

**`subtract_arrayFrom(a, b)`** — Returns elements of `b` not in `a`. Note: implementation uses `filter(c => a.filter(d => c != d))` which filters by truthiness of nested array — effectively returns all of `b` (apparent bug).

**`strip_duplicates(array)`** — Iterates, pushes to result only if not already included. Reference equality.

**`strip_invalid(array)`** — `strip_duplicates(strip_falsies(array))`.

**`uniquely_concatenateArrays(a, b)`** — Concat then strip duplicates.

**`convert_toNumber(values: Array<boolean>)`** — Treats boolean array as binary flags. `values[0]` = bit 0, `values[1]` = bit 1, etc. Returns integer representation.

**`remove<T>(from: Array<T>, item: T)`** — Finds by reference equality (`===`), splices in-place. Returns the mutated array.

**`remove_fromArray_byReference<T>(item: T, array: Array<T>)`** — Filter by reference equality. Returns new array (non-mutating).

**`indexOf_inArray_byReference<T>(item: T, array: Array<T>)`** — `findIndex` by reference. Returns `-1` if item is falsy.

**`copyObject(obj: any)`** — Shallow copy preserving prototype: `Object.create(prototype)` + `Object.assign`.

### Identifiable array operations

**`strip_invalid_Identifiables(array)`** — `strip_identifiableDuplicates(strip_falsies(array))`.

**`uniquely_concatenateArrays_ofIdentifiables(a, b)`** — Concat then strip invalid identifiables.

**`remove_fromArray<T extends Identifiable>(item: T, array: Array<T>)`** — Filters by `e.id !== item.id`. Non-mutating.

**`indexOf_inArray<T extends Identifiable>(item: T, array: Array<T>)`** — `findIndex` by `e.id === item.id`.

**`strip_identifiableDuplicates(identifiables: Array<Identifiable>)`** — Deduplicates by `hid`. First occurrence wins. Builds a `Record<number, Identifiable>` guard map.

### JSON

**`stringify_object(object: Object)`**
`JSON.stringify` with a replacer that omits these fields:
`hid`, `state`, `idBase`, `hidChild`, `hidParent`, `isGrabbed`, `bulkRootID`, `t_database`, `persistence`, `selectionRange`.
Uses indent of `1`.

### Math

**`polygonPoints(radius: number, count: number, offset: number)`**
Returns array of `Point` at equal angular intervals around a circle:
- `increment = 2π / count`
- Starting angle = `offset`
- Pushes `Point.fromPolar(radius, angle)` for each step.
Used by `SVG_Paths.polygon`.

**`cumulativeSum(array: Array<number>)`**
Prefix sum array. `[10, 20, 30]` → `[10, 30, 60]`. Uses `reduce` with a side-effect push to `result`.

### Object conversion

**`convertToObject(instance: any, fields: string[])`**
Extracts named fields from an instance into a plain object. Only includes fields that `hasOwnProperty` returns true for.

---

## Print.ts

`utilities/Print.ts` — class `Print`. Singleton exported as `print`. Depends on `print-js` library and `Printable.svelte` component.

### `print_element_byClassName_withRect(className: string, rect: Rect, title: string)`
Entry point for printing a graph by CSS class name. Queries DOM for `.${className}`, delegates to `print_element_withRect`.

### `async print_element_withRect(element: HTMLElement, rect: Rect, title: string)`
Main print flow:
1. Guards against zero-dimension elements (logs error if `offsetWidth === 0 || offsetHeight === 0`).
2. Waits 100ms (`setTimeout` wrapped in `Promise`).
3. Calls `u.temporarily_setDefaults_while` — resets background to white, clears grabs.
4. Inside the callback: determines orientation (`isLandscape = width > height`), calls `setup_printable` then `print_printable`.

### `setup_printable(element: HTMLElement, rect: Rect)` (private)
Creates a `div`, mounts a `Printable` Svelte component into it with `{ element, rect }` props. Stores result in `this.printable`.

### `print_printable(isLandscape: boolean, title: string)` (private)
Calls `printJS` with:
- `type: 'html'`
- `documentTitle: title`
- `printable: this.printable`
- `scanStyles: false`
- CSS `@page` block setting `size: A4 landscape` or `A4 portrait`.

---

## Extensions.ts (common)

`common/Extensions.ts` — prototype extensions on `String` and `Number`. All use `Object.defineProperty` with `enumerable: false`, `writable: false`, `configurable: false` (except `hash` and `toFixed` which use `true` for all three).

### String extensions

**`.unCamelCase()`**
Inserts a space before each uppercase letter, lowercases all. `'fooBar'` → `'foo bar'`.

**`.removeWhiteSpace()`**
Replaces `\n` with space, removes `\t`, trims. Result is single-line.

**`.encode_as_property()`**
Makes a string safe as a TypeScript property name:
- Calls `removeWhiteSpace()`
- Spaces → `_`
- `-` → `$$$`
- `(` → `$$`
- `)` → `$`

**`.decode_from_property()`**
Reverses `encode_as_property`:
- `$$$` → `-`
- `$$` → `(`
- `$` → `)`

**`.removeOccurencesOf(characters: string)`**
Strips leading/trailing occurrences of any character in `characters` string. Uses regex `^[chars]+|[chars]+$` with `g` flag. Trims result.

**`.lastWord()`**
Splits on space, returns last element.

**`.fontSize_relativeTo(base: number)`**
Parses CSS font-size strings:
- If contains `'em'`: returns `base * parseFloat(...)`.
- If contains `'px'`: returns the pixel number.
- Otherwise: `Number(this)`.

**`.injectEllipsisAt(at: number = 6)`**
If `length > (at * 2) + 1`: inserts `' ... '` at position `at` from each end. `'abcdefghij'.injectEllipsisAt(3)` → `'abc ... hij'`.

**`.clipWithEllipsisAt(at: number = 15)`**
If `length > at`: clips to `at` chars and appends `' ...'`.

**`.beginWithEllipsis_forLength(length: number = 6)`**
If longer than `length`: prepends `' ... '` and takes last `length` characters.

**`.hash()`**
djb2-style 32-bit integer hash:
```
hash = ((hash << 5) - hash) + charCode
hash |= 0  // 32-bit integer
```
Returns `0` for empty strings.

**`.html_encode()`**
Strips newlines, trims, `encodeURIComponent`, then selectively un-encodes readable chars:
- `%22` → `'` (single quote, not double)
- `%2B` → `+`, `%3A` → `:`, `%3F` → `?`, `%23` → `#`, `%2F` → `/`, `%3D` → `=`, `%20` → ` `
- `<` and `>` remain encoded (commented-out lines).

**`.sizeOf_svgPath()`** (declared but implementation returns `this.split(' ').slice(-1)[0]` — appears vestigial/incorrect, declared as returning `string`.)

### Number extensions

**`.isAlmost(target: number, within: number)`**
`Math.abs(this - target) < within`.

**`.force_between(a: number, b: number)`**
Clamps to `[min(a,b), max(a,b)]`.

**`.force_asInteger_between(a: number, b: number)`**
`Math.round(this.force_between(a, b))`.

**`.increment(increase: boolean, total: number)`**
Calls `increment_by(increase ? 1 : -1, total)`.

**`.increment_by(delta: number, total: number)`**
`(this + delta).normalize_between_zeroAnd(total)`. Modular arithmetic increment.

**`.normalize_between_zeroAnd(value: number)`**
Clock arithmetic: adds or subtracts `value` until result is in `[0, value)`. Handles negative inputs via while loop.

**`.angle_normalized()`**
`this.normalize_between_zeroAnd(Math.PI * 2)`. Maps any angle to `[0, 2π)`.

**`.angle_normalized_aroundZero()`**
Maps to `[-π, π)`. `(this + π).angle_normalized() - π`.

**`.add_angle_normalized(angle: number)`**
`(this + angle).angle_normalized()`.

**`.straddles_zero(other: number)`**
`this.angle_normalized() > other.angle_normalized()`. Returns true if `this` is "clockwise past" `other` when both are normalized.

**`.isBetween(a: number, b: number, inclusive: boolean)`**
Range check. `inclusive` controls `>=`/`<=` vs `>`/`<`.

**`.isClocklyBetween(a: number, b: number, normalizeTo: number)`**
Checks if value is between `a` and `b` either directly or when shifted by `normalizeTo` (for circular ranges).

**`.isClocklyAlmost(target: number, within: number, normalizeTo: number)`**
`this.isClocklyBetween(target - within, target + within, normalizeTo)`.

**`.roundToEven()`**
`Math.round(this / 2) * 2`. Rounds to nearest even integer.

**`.asDegrees()`**
Delegates to `degrees_of(0)`.

**`.degrees_of(precision: Integer)`**
`(this * 180 / π).toFixed(precision)`.

**`.supressNegative()`**
Returns `''` if negative, else `this`.

**`.supressZero()`**
Returns `'-'` if zero, else `this`.

**`.asInt()`**
`this.toFixed(0)`.

**`.of_n_for_type(n: number, type: string, plurality: string)`**
Returns `'${type}${plural}: ${(this+1).nth()} of ${n}'`. Used for ordinal display like "child: 3rd of 7".

**`.nth()`**
Ordinal suffix (1st, 2nd, 3rd, 4th...): standard English rules with special case for 11–19 (all "th").

**`.toFixed(precision: Integer)`** (overrides native)
Uses `Intl.NumberFormat` with `style: 'decimal'`, `useGrouping: false`, fixed min/max fraction digits. Consistent cross-browser formatting.

**`.bump_towards(smallest: number, largest: number, within: number)`**
Snaps to `smallest` or `largest` if within `within` of either boundary. Otherwise returns `this` unchanged.

---

## Constants.ts

`common/Constants.ts` — class `Constants`. Singleton exported as `k`.

Module-level constants (not on the class):
```typescript
const dot_size = 14;
const row_height = 16;
const rubberband_thickness = 1;
const tiny_outer_dots_expansion = 6;
const tiny_outer_dots_diameter = dot_size + tiny_outer_dots_expansion;  // = 20
```

### Scalar fields

| Field | Value | Notes |
|---|---|---|
| `details_margin` | `0` | |
| `halfIncrement` | `0.5` | Used in ellipses spacing |
| `separator_title_left` | `0` | |
| `hid_unknown` | `1000000000000` | Sentinel hid for unknown |
| `radial_widget_inset` | `dot_size + 14 = 28` | |
| `printer_aspect_ratio` | `11.69 / 8.27 ≈ 1.414` | A4 ratio |
| `prevent_selection_style` | CSS string | Disables text selection |
| `nothing_to_show` | `'Please select something to show here'` | Placeholder message |
| `name_bulkAdmin` | `'Jonathan Sand'` | Admin name |
| `cursor_default` | `'default'` | |
| `corrupted` | `'corrupted'` | |
| `unknown` | `'unknown'` | |
| `root` | `'root'` | |
| `empty_id` | `'""'` | |
| `newLine` | `'\n'` | |
| `wildcard` | `'*'` | |
| `comma` | `','` | |
| `quote` | `'"'` | |
| `space` | `' '` | |
| `empty` | `''` | |
| `tab` | `'\t'` | |

### `dasharray`

| Key | Value | Used for |
|---|---|---|
| `relateds` | `'4,3'` | Dashed stroke for related relationships |
| `editing` | `'3,2'` | Dashed stroke while editing |

### `width`

| Key | Value |
|---|---|
| `details` | `219` |
| `child_gap` | `20` |

### `help_url`

| Key | Value |
|---|---|
| `local` | `'http://localhost:8000/README.html'` |
| `remote` | `'https://help.webseriously.org'` |

### `title`

| Key | Value |
|---|---|
| `default` | `'Please, enter a title'` |
| `line` | `'------------------------'` |

### `ratio`

| Key | Value |
|---|---|
| `zoom_out` | `0.9` |
| `zoom_in` | `1.1` |

### `separator`

| Key | Value | Notes |
|---|---|---|
| `generic` | `'::'` | Two colons |
| `small` | `':::'` | Three colons |
| `big` | `'::::'` | Four colons |

### `threshold` (milliseconds)

| Key | Value |
|---|---|
| `autorepeat` | `150` |
| `double_click` | `400` |
| `alteration` | `500` |
| `long_click` | `800` |

### `tiny_outer_dots`

| Key | Value | Notes |
|---|---|---|
| `diameter` | `20` | `dot_size + expansion = 14 + 6` |
| `expansion` | `6` | |
| `size` | `Size.square(20)` | |
| `offset` | `Point.square(-6).offsetByXY(4.2, 5)` | Positioning offset for SVG viewBox alignment |
| `viewBox` | `'0.5 2.35 20 20'` | SVG viewBox string |

### `radius`

| Key | Value |
|---|---|
| `text_area_border` | `7` |
| `arcSlider_cap` | `7.5` |
| `ring_minimum` | `55` |
| `fillets.thick` | `14` |
| `fillets.thin` | `8` |
| `fillets.ultra_thin` | `5` |

### `height`

All derived from `row_height = 16` and `dot_size = 14`:

| Key | Value | Formula |
|---|---|---|
| `separator` | `7` | |
| `empty` | `22` | |
| `line` | `18` | `row_height + 2` |
| `segmented` | `17` | `row_height + 1` |
| `row` | `16` | `row_height` |
| `controls` | `16` | |
| `button` | `17` | `dot_size + 3` |
| `dot` | `14` | `dot_size` |

### `font_size`

All derived from `dot_size = 14`:

| Key | Value | Formula |
|---|---|---|
| `cluster_slider` | `9` | `dot_size - 5` |
| `instructions` | `10` | `dot_size - 4` |
| `separator` | `10` | `dot_size - 4` |
| `details` | `11` | `dot_size - 3` |
| `banners` | `12` | `dot_size - 2` |
| `info` | `13` | `dot_size - 1` |
| `common` | `14` | `dot_size` |
| `segmented` | `15` | `dot_size + 1` |
| `warning` | `16` | `dot_size + 2` |
| `tree_prefs` | `36` | Fixed |

### `thickness`

| Key | Value |
|---|---|
| `stroke` | `0.7` |
| `rubberband` | `1` |
| `radial.ring` | `44` |
| `radial.arc` | `15` |
| `radial.fork` | `2.5` |
| `separator.main` | `5` |
| `separator.banners` | `2.5` |
| `separator.details` | `0.75` |

### `opacity`

| Key | Value |
|---|---|
| `none` | `0` |
| `faint` | `0.1` |
| `light` | `0.2` |
| `medium` | `0.4` |
| `dark` | `0.7` |
| `cluster.faint` | `0.02` |
| `cluster.armature` | `0.1` |
| `cluster.thumb` | `0.1` |
| `cluster.hover` | `0.7` |
| `cluster.titles` | `1` |
| `cluster.active` | `0.3` |

---

## Builds.ts

`common/Builds.ts` — class `Builds`. Singleton exported as `builds`.

### `notes: Record<number, Array<string>>`

Build history. Each key is a build number (integer). Each value is a two-element array: `[dateString, descriptionString]`.

The full build log spans build `10` (August 2, 2023) through build `192` (February 4, 2026).

Selected significant builds:
| Build | Date | Note |
|---|---|---|
| `10` | Aug 2, 2023 | First recorded build |
| `118` | Nov 27, 2024 | OFFICIAL ALPHA RELEASE |
| `192` | Feb 4, 2026 | GOLDEN MASTER |

### `build_number: string`

```typescript
build_number = Object.keys(this.notes).slice(-1)[0];
```

Takes the last key from `notes` as the current build number string. Note: `Object.keys` on a numeric-keyed object returns keys in ascending numeric order in V8/modern JS engines, so this reliably returns the highest build number. Used for display in a builds button.

---

## Debug.ts

`debug/Debug.ts` — enum `T_Debug`, class `Debug`. Singleton exported as `debug = new Debug([])`.

### `T_Debug` enum

All values are string literals (used as query string tokens). Full list:

| Enum value | String | Description |
|---|---|---|
| `bidirectionals` | `'bidirectionals'` | |
| `preferences` | `'preferences'` | |
| `hide_rings` | `'hide_rings'` | |
| `component` | `'component'` | `S_Component` state |
| `fast_load` | `'fast_load'` | |
| `segments` | `'segments'` | |
| `actions` | `'actions'` | State logic of actions |
| `reticle` | `'reticle'` | Show center of radial layout |
| `action` | `'action'` | |
| `bubble` | `'bubble'` | |
| `colors` | `'colors'` | |
| `cursor` | `'cursor'` | |
| `crumbs` | `'crumbs'` | |
| `expand` | `'expand'` | |
| `handle` | `'handle'` | |
| `layout` | `'layout'` | Branches and widgets |
| `radial` | `'radial'` | |
| `remote` | `'remote'` | Interactions with remote databases |
| `signal` | `'signal'` | |
| `things` | `'things'` | Properties of things |
| `build` | `'build'` | Completely reattach graph and DOM |
| `error` | `'error'` | Async errors |
| `focus` | `'focus'` | Watch for and log focus changes |
| `graph` | `'graph'` | Size of graph area |
| `lines` | `'lines'` | Alignment dots for lines and widgets |
| `mouse` | `'mouse'` | |
| `order` | `'order'` | |
| `style` | `'style'` | |
| `trace` | `'trace'` | Appends stack trace to all logs |
| `draw` | `'draw'` | |
| `edit` | `'edit'` | State machine for editing |
| `grab` | `'grab'` | |
| `hits` | `'hits'` | |
| `move` | `'move'` | |
| `key` | `'key'` | Keyboard input |

### `Debug` class

**Constructor**: `constructor(flags: Array<T_Debug>)` — stores flags array.

**`hasOption(option: T_Debug)`** — `this.flags.includes(option)`.

**`captureStackTrace()`** — `new Error().stack`. Returns current stack as string.

### Boolean getters (frequently checked flags)

All call `hasOption`:

`graph`, `focus`, `lines`, `trace`, `cursor`, `radial`, `crumbs`, `reticle`, `actions`, `fast_load`, `component`, `hide_rings`.

### Named log methods

Each calls `log_maybe` with its corresponding `T_Debug` flag:

`log_key`, `log_draw`, `log_edit`, `log_grab`, `log_hits`, `log_move`, `log_build`, `log_error`, `log_lines`, `log_mouse`, `log_style`, `log_action`, `log_bubble`, `log_colors`, `log_crumbs`, `log_cursor`, `log_expand`, `log_handle`, `log_layout`, `log_radial`, `log_remote`, `log_signal`, `log_actions`, `log_segments`, `log_component`, `log_preferences`, `log_bidirectionals`.

`log_alert(option, message)` — calls `alert(message)` directly (unconditional).

### `log_maybe(option: T_Debug, message: string, ...args: any[])`

Core dispatch:
1. If `hasOption(option)` is false: does nothing.
2. Joins `message` and `args` with `' '`.
3. If `trace` flag is active: prepends `\n` and appends `\n${captureStackTrace()}`.
4. `console.log(option.toUpperCase(), log)`.

### `apply_queryStrings(queryStrings: URLSearchParams)`

Called at startup. Reads `debug` query string (e.g., `?debug=colors,lines,trace`). Splits on `,`. For each token, pushes the matching `T_Debug` value into `this.flags` via a switch statement covering all 35 enum values.

---

## ErrorTrace.ts

`debug/ErrorTrace.ts` — class `ErrorTrace extends Error`.

### Purpose

A custom Error subclass that captures a clean stack trace excluding the constructor frame itself.

### Constructor

```typescript
constructor(message: string) {
    super(message);
    this.name = this.constructor.name;  // = 'ErrorTrace'
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
    }
}
```

`Error.captureStackTrace` is a V8-only API. When present, it sets `this.stack` without including the `ErrorTrace` constructor call in the trace. This produces cleaner error output in Chrome/Node. Falls back to standard `Error` behavior in other engines.

No singleton. Instantiated as needed: `throw new ErrorTrace('message')` or passed as an error value.

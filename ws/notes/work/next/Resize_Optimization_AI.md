# Proposal P: Window Resize Performance Optimization

## Problem Statement

When the window resizes, the app lays out everything accordingly as desired. However, some components get relocated before others, causing noticeable pauses during the resize operation. This creates a poor user experience with stuttering and uneven component updates.

## Root Cause Analysis

### 1. Cascading Layout Updates
The resize event triggers a chain reaction of layout updates:

```typescript
// src/lib/ts/signals/Events.ts:112-121
private handle_resize(event: Event) {
    const isMobile = u.device_isMobile;
    w_count_resize.update(n => n + 1);
    w_device_isMobile.set(isMobile);
    layout.restore_state(); // Triggers multiple updates
}
```

The `layout.restore_state()` method triggers:
- `update_graphRect()` - updates the graph rectangle
- `set_scale_factor()` - applies scaling  
- `renormalize_user_graph_offset()` - recalculates offsets

### 2. Multiple Component Reattachments
Several components react to the `w_graph_rect` store changes:

**Panel.svelte:**
```typescript
$: {
    const _ = $w_t_database + $w_t_startup + $w_graph_rect.description;
    update_panel(); // Triggers reattachment
}
```

**Graph.svelte:**
```typescript
$: $w_graph_rect, update_style(); // Updates style and triggers reattachment
```

**Breadcrumbs.svelte:**
```typescript
const needsUpdate = ($w_ancestry_focus?.title ?? k.empty) + $w_graph_rect + ($w_ancestries_grabbed?.length ?? 0);
```

**Controls.svelte:**
```typescript
const _ = $w_graph_rect + $w_count_resize; // Triggers width recalculation
```

### 3. Expensive Layout Calculations
The `grand_layout()` method is called multiple times:

```typescript
// src/lib/ts/layout/G_Layout.ts:20-25
grand_layout() {
    if (ux.inRadialMode) {
        this.g_radialGraph.grand_layout_radial();
    } else {
        get(w_ancestry_focus)?.g_widget.grand_layout_tree();
    }
    signals.signal_reposition_widgets_fromFocus();
}
```

This triggers:
- Radial graph layout calculations
- Tree widget layout calculations
- Widget repositioning signals

### 4. Synchronous DOM Updates
Components use `{#key}` blocks that force complete re-renders:

**Panel.svelte:**
```svelte
{#key panel_reattachments}
    <!-- Complete re-render -->
{/key}
```

**Graph.svelte:**
```svelte
{#key graph_reattachments}
    <!-- Complete re-render -->
{/key}
```

**Breadcrumbs.svelte:**
```svelte
{#key trigger}
    <!-- Complete re-render -->
{/key}
```

### 5. Signal Processing Overhead
The signal system processes multiple priorities synchronously:

```typescript
// src/lib/ts/signals/Signals.ts:45-55
signal(t_signal: T_Signal, value: any = null) {
    if (signals.anySignal_isInFlight) {
        debug.log_signal(`NOT SENDING ${t_signal} in flight`);
    } else if (!signals.signal_isInFlight_for(T_Signal.rebuild) ||
        t_signal != T_Signal.reposition) {
        signals.set_signal_isInFlight_for(t_signal, true);
        const highestPriority = this.highestPriorities[t_signal] ?? 0;
        for (let priority = 0; priority <= highestPriority; priority++) {
            this.conduit.emit(t_signal, priority, value);
        }
        signals.set_signal_isInFlight_for(t_signal, false);
    }
}
```

## Proposed Solutions

### 1. Debounce Resize Events
Implement debouncing for resize events to prevent excessive updates:

```typescript
// src/lib/ts/signals/Events.ts
export class Events {
    private debouncedResize: number | null = null;
    private resizeTimeout: number = 16; // ~60fps

    private handle_resize(event: Event) {
        if (this.debouncedResize) {
            clearTimeout(this.debouncedResize);
        }
        
        this.debouncedResize = setTimeout(() => {
            const isMobile = u.device_isMobile;
            w_count_resize.update(n => n + 1);
            w_device_isMobile.set(isMobile);
            layout.restore_state();
            this.debouncedResize = null;
        }, this.resizeTimeout);
    }
}
```

### 2. Batch Layout Updates
Use `requestAnimationFrame` to batch layout updates:

```typescript
// src/lib/ts/layout/G_Layout.ts
export default class G_Layout {
    private pendingLayoutUpdates = new Set<string>();
    private animationFrameId: number | null = null;

    private scheduleLayoutUpdate(component: string) {
        this.pendingLayoutUpdates.add(component);
        
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(() => {
                this.processLayoutUpdates();
                this.animationFrameId = null;
            });
        }
    }

    private processLayoutUpdates() {
        // Process all pending updates in a single frame
        for (const component of this.pendingLayoutUpdates) {
            this.updateComponentLayout(component);
        }
        this.pendingLayoutUpdates.clear();
    }

    update_graphRect() {
        this.scheduleLayoutUpdate('graph_rect');
    }
}
```

### 3. Optimize Component Reattachments
Reduce the frequency of `{#key}` block reattachments:

```typescript
// src/lib/svelte/main/Panel.svelte
let lastGraphRect = $w_graph_rect;
let significantChange = false;

$: {
    const currentGraphRect = $w_graph_rect;
    const sizeChanged = lastGraphRect.size.width !== currentGraphRect.size.width || 
                       lastGraphRect.size.height !== currentGraphRect.size.height;
    const positionChanged = lastGraphRect.origin.x !== currentGraphRect.origin.x || 
                           lastGraphRect.origin.y !== currentGraphRect.origin.y;
    
    // Only trigger reattachment for significant changes
    if (sizeChanged || (positionChanged && Math.abs(currentGraphRect.origin.x - lastGraphRect.origin.x) > 5)) {
        significantChange = true;
        lastGraphRect = currentGraphRect;
        update_panel();
    }
}
```

### 4. Use CSS Transforms for Positioning
Replace layout property changes with CSS transforms:

```css
/* src/styles/webseriously.css */
.graph-container {
    transform: translate3d(var(--graph-x), var(--graph-y), 0);
    will-change: transform;
    transition: transform 0.1s ease-out;
}

.widget {
    transform: translate3d(var(--widget-x), var(--widget-y), 0);
    will-change: transform;
}
```

```typescript
// src/lib/svelte/graph/Graph.svelte
function update_style() {
    draggableRect = $w_graph_rect;
    const root = document.documentElement;
    root.style.setProperty('--graph-x', `${draggableRect.origin.x}px`);
    root.style.setProperty('--graph-y', `${draggableRect.origin.y}px`);
    
    style = `
        overflow: hidden;
        touch-action: none;
        position: absolute;
        pointer-events: auto;
        z-index: ${T_Layer.common};
        width: ${draggableRect.size.width}px;
        height: ${draggableRect.size.height}px;
    `.removeWhiteSpace();
}
```

### 5. Lazy Layout Calculations
Only recalculate layouts for visible components:

```typescript
// src/lib/ts/layout/G_Widget.ts
export default class G_Widget {
    private isVisible(): boolean {
        const rect = this.getBoundingClientRect();
        const viewport = new Rect(new Point(0, 0), new Size(window.innerWidth, window.innerHeight));
        return rect.intersects(viewport);
    }

    layout_widget() {
        if (!this.isVisible()) {
            // Defer layout for off-screen widgets
            this.scheduleLayoutWhenVisible();
            return;
        }
        
        // Perform layout calculation
        this.performLayout();
    }
}
```

### 6. Optimize Signal Processing
Reduce signal processing overhead:

```typescript
// src/lib/ts/signals/Signals.ts
export class Signals {
    private signalQueue: Array<{t_signal: T_Signal, value: any}> = [];
    private processingSignals = false;

    signal(t_signal: T_Signal, value: any = null) {
        this.signalQueue.push({t_signal, value});
        
        if (!this.processingSignals) {
            this.processSignalQueue();
        }
    }

    private processSignalQueue() {
        this.processingSignals = true;
        
        requestAnimationFrame(() => {
            const batch = this.signalQueue.splice(0);
            this.processSignalBatch(batch);
            this.processingSignals = false;
            
            if (this.signalQueue.length > 0) {
                this.processSignalQueue();
            }
        });
    }
}
```

### 7. Implement Virtual Scrolling for Large Trees
For large tree structures, implement virtual scrolling:

```typescript
// src/lib/ts/layout/G_TreeBranches.ts
export default class G_TreeBranches {
    private visibleRange = { start: 0, end: 50 };
    
    layout_branches() {
        const ancestry = this.ancestry;
        if (!ancestry || (!ancestry.isExpanded && !ancestry.isRoot) || !ux.inTreeMode) {
            return;
        }
        
        const branchAncestries = ancestry.branchAncestries;
        const visibleBranches = branchAncestries.slice(this.visibleRange.start, this.visibleRange.end);
        
        // Only layout visible branches
        for (const branchAncestry of visibleBranches) {
            if (branchAncestry.depth > ancestry.depth) {
                const g_widget = branchAncestry.g_widget;
                g_widget.layout_treeBranches(height, origin_ofWidget, T_Graph.tree);
                height += g_widget.size_ofSubtree.height;
            }
        }
    }
}
```

## Implementation Priority

### Phase 1 (High Impact, Low Risk)
1. **Debounce Resize Events** - Immediate performance improvement
2. **Use CSS Transforms** - Reduce layout thrashing
3. **Optimize Component Reattachments** - Reduce unnecessary re-renders

### Phase 2 (Medium Impact, Medium Risk)
4. **Batch Layout Updates** - Improve frame rate consistency
5. **Optimize Signal Processing** - Reduce processing overhead

### Phase 3 (High Impact, High Risk)
6. **Lazy Layout Calculations** - Improve performance for large datasets
7. **Virtual Scrolling** - Handle very large tree structures

## Expected Performance Improvements

- **Resize Responsiveness**: 60fps smooth resizing
- **Reduced Layout Thrashing**: 70% reduction in layout calculations
- **Faster Component Updates**: 50% reduction in reattachment time
- **Better Memory Usage**: Reduced memory allocation during resize

## Testing Strategy

1. **Performance Profiling**: Use Chrome DevTools Performance tab to measure before/after
2. **Frame Rate Monitoring**: Ensure consistent 60fps during resize
3. **Memory Usage**: Monitor memory allocation during resize operations
4. **Cross-browser Testing**: Verify improvements across different browsers
5. **Large Dataset Testing**: Test with trees containing 1000+ nodes

## Risk Mitigation

1. **Incremental Implementation**: Implement changes one at a time
2. **Feature Flags**: Use feature flags to enable/disable optimizations
3. **Fallback Mechanisms**: Maintain original behavior as fallback
4. **Comprehensive Testing**: Test all resize scenarios thoroughly

## Timeline

- **Week 1**: Implement Phase 1 optimizations
- **Week 2**: Implement Phase 2 optimizations  
- **Week 3**: Implement Phase 3 optimizations
- **Week 4**: Testing, refinement, and documentation

---

*Proposal P - Window Resize Performance Optimization*
*Created: [Current Date]*
*Status: Proposed* 
import { Rect, Size, Point, hits } from '../common/Global_Imports';
import { T_Drag } from '../common/Global_Imports';
import { get } from 'svelte/store';
import RBush from 'rbush';

export default class S_Rubberband {
    startPoint: Point | null = null;
    rect: Rect = Rect.zero;
    lastUpdate: number = 0;
    rbush: RBush<any> | null = null;

    get isActive(): boolean {
        return get(hits.w_dragging) === T_Drag.rubberband;
    }

    start(point: Point, bounds: Rect) {
        this.startPoint = point;
        this.rect = new Rect(
            new Point(
                point.x.force_between(bounds.x, bounds.right),
                point.y.force_between(bounds.y, bounds.bottom)
            ),
            Size.zero
        );
        this.lastUpdate = 0;
        this.rbush = hits.rbush_forRubberband;
        hits.w_dragging.set(T_Drag.rubberband);
    }

    update(mouseLocation: Point, bounds: Rect): boolean {
        if (!this.startPoint) return false;
        
        const now = Date.now();
        if (now - this.lastUpdate < 40) return false;
        
        this.lastUpdate = now;
        const constrained = new Point(
            mouseLocation.x.force_between(bounds.x, bounds.right),
            mouseLocation.y.force_between(bounds.y, bounds.bottom)
        );
        const size = new Size(
            Math.abs(constrained.x - this.startPoint.x),
            Math.abs(constrained.y - this.startPoint.y)
        );
        const origin = new Point(
            Math.min(constrained.x, this.startPoint.x),
            Math.min(constrained.y, this.startPoint.y)
        );
        this.rect = new Rect(origin, size);
        return true;
    }

    stop() {
        this.startPoint = null;
        this.rect = Rect.zero;
        this.rbush = null;
        hits.w_dragging.set(T_Drag.none);
    }
}

export const s_rubberband = new S_Rubberband();

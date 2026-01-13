# CSS Lessons

Patterns and gotchas learned from actual work. This file is a collection of situations that cause collaborator to visit an overabundance of dead ends. This file may get renamed as lessons.

## Rounding Line Ends

**Problem:** Can't round ends of `border-top` selectively.

**Solution:** Use a pseudo-element (`::before` or `::after`) positioned absolutely. It's a real box that accepts `border-radius`.

```css
/* Don't do this */
.container {
  border-top: 10px solid #444;
  border-radius: 5px; /* Won't round just the border-top ends */
}

/* Do this */
.container {
  position: relative;
}
.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 10px;
  background: #444;
  border-radius: 5px;
}
```

**Lesson:** Match the technique to what already works. If a standalone div with border-radius works, use the same approach (pseudo-element as a box) rather than fighting border properties.

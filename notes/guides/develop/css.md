# CSS Lessons

Patterns and gotchas learned from actual work.

## Class Lists: Static Markup, Dynamic Appearance

**Static markup, dynamic appearance.**

The DOM is structure. CSS is presentation. They're separate. Using toggle in JS, can change all manner of things — order, direction, visibility, colors, sizes, animations. CSS does the heavy lifting. 

**Class lists** are the secret sauce. JS can use a classList object to alter the class list of an element, and CSS can watch the class list, translating it into all those manner of things.

An example. `flex-direction` and `display` have many layout options. They easily do the same job as me manually resculpting a lot of delicate code.

### Toggle: The Flip-Flop

An element can have multiple classes. `classList.toggle()` adds a class if absent, removes it if present:

```javascript
// First call: adds 'swapped'
row.classList.toggle('swapped');  // class="title-box swapped"

// Second call: removes 'swapped'
row.classList.toggle('swapped');  // class="title-box"
```

### Swapping Left and Right

Using `flex-direction` to reverse layout:

```html
<div class="row">
  <div class="left">A</div>
  <div class="right">B</div>
</div>
```

```css
.row { flex-direction: row; }
.row.swapped { flex-direction: row-reverse; }
```

**Normal:** `[ A ][ B ]`

**Swapped:** `[ B ][ A ]`

Same DOM, opposite visual order:

```javascript
// Swap one row
document.querySelector('.row').classList.toggle('swapped');

// Swap all rows
document.querySelectorAll('.row')
  .forEach(row => row.classList.toggle('swapped'));
```

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

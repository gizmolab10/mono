# Class Lists: Static Markup, Dynamic Appearance

## The Insight

**Static markup, dynamic appearance.**

The DOM is structure. CSS is presentation. They're separate. Using toggle in JS, can change all manner of things — order, direction, visibility, colors, sizes, animations. CSS does the heavy lifting. 

**Class lists** are the secret sauce. JS can use a classList object to alter the class list of an element, and CSS can watch the class list, translating it into all those manner of things.

An example. `flex-direction` and `display` have many layout options. They easily do the same job as me manually resculpting a lot of delicate code.

## Toggle: The Flip-Flop

An element can have multiple classes. `classList.toggle()` adds a class if absent, removes it if present:

```javascript
// First call: adds 'swapped'
row.classList.toggle('swapped');  // class="title-box swapped"

// Second call: removes 'swapped'
row.classList.toggle('swapped');  // class="title-box"
```

## Swapping Left and Right

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


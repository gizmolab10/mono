# Tags hierarchy

In the filters, the linear list is currently quite lengthy (22), challenging to scan by eye. would be easier if some can be encapsulated, and thus hidden. These are the six areas and their tags.

**ai:** session start, collaboration, code-style, prose, 
**ux:** visual design, user interface, geometry
**code:** porting, migration, refactoring, wiring, data
**harness:** platform, setup, deploy, tools, build
**notes:** notes, philosophy, research
**rules:** testing, debugging

## thoughts

need a new kind of pill that can hide and show its tags. i want to call it big. while hidden, big shows just the area. click it and just the tags appear. an inconspicuous and obvious close button.

### the big pill

- start with a title, give the pill a double border
    - place the second border inside, thickness 0.5
    - between them --gap-tight
    - thickness 0.7 for the normal one
- all the tags are this kind
- two states by click
    1. area name
    2. area's tags
- state 2 -> close me at left
- all transitions -> auto pill layout
    - these pills do not divide
- tags - segmented controller with a double border
    - where do the separator lines between segments end?
- unreferenced tags disappear
    - when they all disappear from an area, hide it

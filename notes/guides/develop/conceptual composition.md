---
kind: design
title: "UX terms and concepts"
description: ""
tags: [proposal]
date: 2026-08-07
---
# UX terms and concepts

the code for the app is becoming byzantine. It lacks unifying principles, and i hope it is not too late to inject them. we have separators, but they are being deployed several different ways, which is a burden to layout, with huge amounts of hand tweaking, which is fragile and cryptic.

**Separators** exist to delineate sections. The UX needs sections, and **stacks** of sections. A **section** is a rectangular area of the screen, surrounded by separators and **edges**. Always. Sometimes the rectangular area itself responds to hover and click. Sometimes the separator does.

Read [[composition]] and then analyze the ov editor. Then, describe how composition and props can become our core design template for building the editor page. Eg, it has four main **sections**:

1. title and navigator
2. search
3. filters
4. content

Then within the filter **section** are three **subsections**:

5. title and brief
6. kinds
7. tags

And the content **section** has two **subsections**

8. H1 header
9. scrollable content

## separator

- thickness **prop**
- option to add a title **prop**
- option **prop** for clickable -- all along the sep
- optional extra strip **prop**, along side -> also captures hover and click
- fold -> reduce content to minimum **prop**
## section and subsection

- assumes above and below -> a separator or edge of view
- equal top and bottom padding **prop** around content
- content can change **section** height (eg, tags)

## stack of sections and views

| kind       | separator | foldable  |
| ---------- | --------- | --------- |
| top        | app edge  | never     |
| section    | huge      | often     |
| subsection | normal    | sometimes |

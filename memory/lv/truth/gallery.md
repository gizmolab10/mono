---
type: design
title: Gallery
description: How pictures and captions currently work in lv.
tags: [gallery, pictures, captions, assets]
use_when: [adding pictures, changing how galleries display, caption work, storage decisions]
updated: 2026-08-22
---
# Gallery

A gallery is one folder of pictures under `src/assets/`, shown one at a time. A caption is what a picture is called: written inside the file itself, with the file's name as the answer when there is none.

Pictures live in the repo today; remote hosted storage (Cloudflare, Amazon, or Backblaze) is the named alternative if they outgrow it — no choice among the three is recorded yet.

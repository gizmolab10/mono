# ethernet

## Problem

Want to visualize physical wiring infrastructure (ethernet, USB, etc.) in the app. Browser APIs don't provide this data—`navigator.connection` only gives connection type/speed, WebUSB requires per-device permission and doesn't expose topology. No way to auto-discover physical wiring.

**Real motivation**: Dozens of tangled cables. When one fails, tracing them physically is a nightmare. Need a way to know what connects to what *before* failure hits.

## Goal

Cable inventory and fault isolation:
- Document connections once (painful but one-time)
- When something breaks, consult graph to identify which cable/port to check
- Map graph nodes to physical labels on cables

## Approach

- **Node types**: Define categories (router, switch, hub, device, cable) with relevant properties (ports, speeds, labels)
- **Edge semantics**: Physical connection with port identifiers
- **Existing patterns**: Reuse trait system, or something simpler?

## Resolution

file this for later
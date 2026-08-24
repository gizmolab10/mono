---
name: check
description: Audit the memory system — structure, sizing, terminology, duplication; or independently verify a settle. Use after a settle, before trusting the memory for a big decision, or periodically. Triggers: "check", "check <project>", "check the last settle".
---

# check

Read-only. Reports; fixes nothing unless instructed.

Read `memory/shared/truth/protocol.md`, "Skills" entry for `check` plus the sizing table, and execute the audit it defines: structural validation, sizing limits, terminology drift, duplicated facts, and skill-pointer verification — every skill's referenced `protocol.md` section must still exist.

Aimed at a settle, verify its commit diff cold. If this session performed that settle, say so and ask for the check to be rerun in a new session — a skill cannot freshen its own context, and the checker must not be the settler.

Report as finding → file → suggested fix. An empty report says so in one line.

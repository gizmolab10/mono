# Agent Skills

_AI generated in dialogue with humans. Not fully reviewed._

## Overview

Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. They provide a standardized way to give AI systems like Claude access to task-specific instructions, scripts, and reference materials.

## What are Agent Skills?

At its core, a skill is a folder containing a `SKILL.md` file that includes:
- Metadata (`name` and `description` at minimum)
- Instructions that tell an agent how to perform a specific task
- Optional bundled scripts, templates, and reference materials

### Basic Structure

```
my-skill/
├── SKILL.md          # Required: instructions + metadata
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
└── assets/           # Optional: templates, resources
```

## How Skills Work

Skills use **progressive disclosure** to manage context efficiently:

1. **Discovery**: At startup, agents load only the name and description of each available skill - just enough to know when it might be relevant.

2. **Activation**: When a task matches a skill's description, the agent reads the full `SKILL.md` instructions into context.

3. **Execution**: The agent follows the instructions, optionally loading referenced files or executing bundled code as needed.

This approach keeps agents fast while giving them access to more context on demand.

## The SKILL.md File Format

Every skill starts with a `SKILL.md` file containing YAML frontmatter and Markdown instructions:

```markdown
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
---

# PDF Processing

## When to use this skill
Use this skill when the user needs to work with PDF files...

## How to extract text
1. Use pdfplumber for text extraction...

## How to fill forms
...
```

### Required Frontmatter

- `name`: A short identifier
- `description`: When to use this skill

### Markdown Body

The Markdown body contains the actual instructions and has no specific restrictions on structure or content.

## Key Advantages

- **Self-documenting**: A skill author or user can read a `SKILL.md` and understand what it does, making skills easy to audit and improve.

- **Extensible**: Skills can range in complexity from just text instructions to executable code, assets, and templates.

- **Portable**: Skills are just files, so they're easy to edit, version, and share.

## Use Cases

Agent skills enable:
- Task-specific workflows (e.g., PDF processing, data analysis)
- Domain-specific knowledge (e.g., medical terminology, legal procedures)
- Tool integrations (e.g., API interactions, database queries)
- Code generation patterns (e.g., testing frameworks, deployment scripts)
- Documentation and reference materials access

## Implementation

AI systems that support agent skills can:
- Load skill metadata at startup for discovery
- Activate skills dynamically based on user requests
- Execute skill instructions and bundled code
- Access skill assets and reference materials

## Resources

- **Official Website**: https://agentskills.io/what-are-skills
- **Specification**: https://agentskills.io/specification
- **Example Skills**: https://github.com/anthropics/skills
- **Integration Guide**: https://agentskills.io/integrate-skills
- **Best Practices**: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- **Reference Library**: https://github.com/agentskills/agentskills/tree/main/skills-ref

## Related Concepts

- [[Agentic AI]] - Autonomous AI systems that can perform tasks
- [[Prompt Engineering]] - Crafting effective instructions for AI systems
- [[Tool Use]] - AI systems using external tools and APIs

## Tags

#ai #agents #skills #tools #automation #standards

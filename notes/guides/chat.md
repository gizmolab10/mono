# Effective Problem-Solving with Claude

A guide to defining problems, setting goals, and tracking your approach through to resolution. To begin, use the new md file.

## The Basic Flow

Every productive conversation with Claude follows a pattern:

- [ ] **Track the approach** - in the new md file, record decisions and changes as you go
- [ ] **Define the problem** - What's not working or what do you need?
- [ ] **Set the goal** - What would success look like?
- [ ] **Arrive at resolution** - Verify the solution works

## Starting Strong: Define the Problem

The clearer your problem statement, the better Claude can help. So prompt me with this:

**Good problem statements:**

* "MCP filesystem errors appear on startup but access still works"
* "Documentation links are broken after reorganizing folders"
* "Need to understand why component reactivity isn't triggering"

**Weak problem statements:**

* "It's not working"
* "Something's wrong with the code"
* "Fix this"

### What to Include

* **Context**: What were you doing when the problem appeared?
* **Symptoms**: What specifically isn't working?
* **Environment**: Relevant tools, versions, or settings
* **Previous attempts**: What have you already tried?

## Setting Clear Goals

Goals help you know when you're done. So prompt me with this:

**Specific goals:**

* "Update access.md with MCP troubleshooting steps"
* "Fix all broken links in the documentation"
* "Refactor the Graph component to use stores consistently"

**Vague goals:**

* "Make it better"
* "Improve the docs"
* "Clean up the code"

### Types of Goals

* **Fix**: Resolve a specific problem
* **Build**: Create something new
* **Understand**: Learn how something works
* **Refactor**: Improve existing code without changing behavior
* **Document**: Capture knowledge for future reference

## Tracking Your Approach

As you work through a problem, document key decisions and changes.

### Use Resume Points

When you make significant progress, mark it:

```markdown
🔖 RESUME POINT: Confirmed filesystem access works despite error messages
```

This helps you (and Claude) pick up where you left off in future conversations.

### Document What You Learn

As you discover things:

* Update relevant documentation immediately
* Note why certain approaches failed
* Capture successful patterns

### Keep Files Updated

Don't just discuss changes - actually make them:

* Fix the code
* Update the docs
* Create the examples
* Add the tests

## Arriving at Resolution

You know you're done when:

* The original problem is solved
* The goal is achieved
* Changes are documented
* You can verify it works

### Verification Steps

Before closing a conversation:

1. **Test the solution**: Does it actually work?
2. **Check side effects**: Did fixing one thing break another?
3. **Update documentation**: Are the changes captured?
4. **Note any follow-ups**: What still needs attention?

## Example: The MCP Errors Issue

Here's how this process worked for the MCP filesystem errors:

**Problem Defined:**
"Seeing 'Server disconnected' and 'write EPIPE' errors in Claude Desktop. Are these ignorable?"

**Goal Set:**
Document whether errors can be ignored and how to prevent them.

**Approach Tracked:**



1. Verified filesystem access works (2x)
2. Searched for suppression methods
3. Tested prevention steps
4. Updated access.md with findings

**Resolution Reached:**

* Errors are cosmetic, can be ignored
* Prevention steps don't work
* No way to suppress in UI
* Everything documented in access.md

**Resume Point Set:**
"Intermittent MCP errors are appearing but filesystem access is confirmed working"

## Tips for Better Conversations

### Ask Claude to Verify

Don't assume - ask Claude to check:

* "Can you verify filesystem access works?"
* "Read the current version of that file first"
* "Check if those links are actually broken"

### Reference Past Context

Use Claude's memory tools:

* "What did we discuss about component patterns?"
* "Find our conversation about documentation structure"
* "Continue from where we left off with the Graph refactoring"

### Be Specific About Actions

Instead of:

* "Update the docs"

Say:

* "Update access.md with these prevention steps, then execute them"

### Iterate When Needed

If the first attempt doesn't work:

* Ask why it failed
* Try a different approach
* Document what didn't work
* Keep refining until it does

## When to Start a New Conversation

Start fresh when:

* You've completed a distinct task
* The conversation has drifted off-topic
* You need Claude to forget previous context
* You're switching to a completely different problem

Continue the same conversation when:

* Working on related sub-tasks
* Iterating on a solution
* The context builds on previous work
* You want Claude to remember decisions made

## Common Patterns

### The Investigation



1. "Why is X happening?"
2. Claude investigates (reads files, searches)
3. Explains the root cause
4. Suggests solutions

### The Fix



1. "This is broken, here's the error"
2. Claude diagnoses the issue
3. Proposes a fix
4. Implements and verifies it works

### The Build



1. "I need to create X"
2. Discuss requirements and constraints
3. Design the approach
4. Implement incrementally
5. Test and refine

### The Refactor



1. "This code works but needs improvement"
2. Identify specific issues
3. Plan the refactoring
4. Make changes systematically
5. Verify behavior unchanged

## Making the Most of Claude's Tools

### Filesystem Access

* Claude can read your actual files
* Changes can be made directly to your repo
* Always work from current versions

### Web Search

* For current information beyond training data
* To verify facts or find recent changes
* To research best practices

### Conversation Search

* Find relevant past discussions
* Build on previous work
* Avoid repeating solved problems

### Memory

* Claude remembers your preferences
* Knows your project context
* Adapts to your workflow

## Summary

Effective problem-solving with Claude:



1. **Start** with a clear problem and goal
2. **Track** your progress and decisions
3. **Document** what you learn
4. **Verify** the solution works
5. **Mark** resume points for future reference

The key is treating Claude as a collaborative partner in solving problems, not just a question-answering system. Define what you need, track the journey, and capture the results.
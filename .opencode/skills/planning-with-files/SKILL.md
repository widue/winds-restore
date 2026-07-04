---
name: planning-with-files
description: "Manus-style persistent file-based planning for AI coding agents: keeps task_plan.md, findings.md, and progress.md on disk so work survives context loss and /clear. Use when asked to plan out, break down, or organize a multi-step project, research task, or any work requiring 5+ tool calls. Supports automatic session recovery after /clear."
user-invocable: true
allowed-tools: "Read Write Edit Bash Glob Grep"
---

# Planning with Files

Work like Manus: Use persistent markdown files as your "working memory on disk."

## Quick Start

Before ANY complex task:

1. **Create `task_plan.md`** — Phases, progress, decisions
2. **Create `findings.md`** — Research, discoveries
3. **Create `progress.md`** — Session log, test results
4. **Re-read plan before decisions** — Refreshes goals in attention window
5. **Update after each phase** — Mark complete, log errors

## The Core Pattern

```
Context Window = RAM (volatile, limited)
Filesystem = Disk (persistent, unlimited)

→ Anything important gets written to disk.
```

## Critical Rules

1. **Create Plan First** — Never start a complex task without `task_plan.md`
2. **The 2-Action Rule** — After every 2 view/browser/search operations, IMMEDIATELY save key findings
3. **Read Before Decide** — Before major decisions, read the plan file
4. **Update After Act** — After completing any phase, mark status and log errors
5. **Log ALL Errors** — Every error goes in the plan file
6. **Never Repeat Failures** — Track what you tried, mutate the approach

## The 3-Strike Error Protocol

```
ATTEMPT 1: Diagnose & Fix
ATTEMPT 2: Alternative Approach
ATTEMPT 3: Broader Rethink
AFTER 3 FAILURES: Escalate to User
```

## When to Use

**Use for:** Multi-step tasks (3+ steps), research tasks, building projects
**Skip for:** Simple questions, single-file edits, quick lookups

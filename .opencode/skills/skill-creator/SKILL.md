---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

## Process

1. Decide what you want the skill to do and how it should do it
2. Write a draft of the skill
3. Create test prompts and run claude-with-access-to-the-skill on them
4. Help the user evaluate results qualitatively and quantitatively
5. Rewrite the skill based on feedback
6. Expand the test set and iterate

## Creating a Skill

### Capture Intent
- What should this skill enable the agent to do?
- When should it trigger?
- What's the expected output format?

### Write the SKILL.md

- **name**: Skill identifier
- **description**: When to trigger, what it does (make it slightly pushy)
- Clear, imperative instructions
- Progressive disclosure: metadata always in context, body on trigger, resources as needed

### Test Cases

After writing, come up with 2-3 realistic test prompts. Run them with and without the skill.

## Evaluation Loop

1. Spawn with-skill and baseline subagents in parallel
2. Draft assertions while runs are in progress
3. Grade each run
4. Aggregate into benchmark
5. Launch viewer for human review
6. Read feedback, improve, repeat

## Description Optimization

After the skill is working well, optimize the description for better triggering:
1. Create 20 eval queries (mix of should-trigger and should-not-trigger)
2. Run the optimization loop
3. Apply the best description

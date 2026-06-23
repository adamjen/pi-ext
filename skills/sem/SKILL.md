---
name: sem
description: Entity-aware code change analysis using the pi-sem tools. Use for blast radius, context, reviews, or semantic diffs.
---

# sem

Use `pi-sem` tools as a **semantic lens**, not a universal replacement for `git diff`.

## Default Decision Tree

1. **Focused entity understanding** $\rightarrow$ `sem_context`
2. **Blast radius / affected tests** $\rightarrow$ `sem_impact`
3. **Structural inventory** $\rightarrow$ `sem_entities`
4. **Semantic diff / summary** $\rightarrow$ `sem_diff`
5. **History / ownership** $\rightarrow$ `sem_log`, `sem_blame`

## Review Workflow

1. `sem_diff` for semantic overview.
2. `sem_impact` on the riskiest changed entities.
3. `sem_context` for deep dives into suspicious entities.
4. Confirm with raw `git diff` or `read` before citing line numbers.

## Guidelines & Caveats

- **Not infallible**: `sem` may under-cover tests, assets, or non-semantic glue code.
- **Verify**: Don't cite `sem` output alone for line-level review; check the actual code.
- **Fallback**: If coverage is incomplete, use `git diff`, `read`, or `grep`.
- **Avoid `sem_diff` overkill**: Use `sem_context` if you only need to understand one entity.

## Prompting Guide

- "What changed in this commit?" $\rightarrow$ `sem_diff`
- "What tests are affected by this function?" $\rightarrow$ `sem_impact` (`scope=tests`)
- "Focused context for this class" $\rightarrow$ `sem_context`
- "What is in this file?" $\rightarrow$ `sem_entities`
```

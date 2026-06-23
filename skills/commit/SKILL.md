---
name: commit
description: "Read this skill before making git commits"
---

# Commit

Create a git commit using a concise Conventional Commits-style subject.

## Format

`<type>(<scope>): <summary>`

- `type` REQUIRED: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`.
- `scope` OPTIONAL: Short noun (e.g., `api`, `ui`).
- `summary` REQUIRED: Short, imperative, <= 72 chars, no trailing period.

## Notes

- **Body**: OPTIONAL. Add a blank line after the subject.
- **No Footers**: Do NOT include breaking-change markers or sign-offs.
- **Commit Only**: Do NOT push.
- **Scope**: If file paths/globs are provided, stage/commit only those.
- **Ambiguity**: If unclear which files to commit, ask the user.

## Steps

1. Review `git status` and `git diff`.
2. Stage intended files (limit to provided paths if specified).
3. Run `git commit -m "<subject>"` (and `-m "<body>"` if needed).
```

---
name: github
description: "Interact with GitHub using the `gh` CLI."
---

# GitHub Skill

Use the `gh` CLI. Always specify `--repo owner/repo` when not in a git directory.

## Pull Requests & Runs

- CI status: `gh pr checks <pr-number> --repo owner/repo`
- List runs: `gh run list --repo owner/repo --limit 10`
- View run/logs: `gh run view <run-id> --repo owner/repo [--log-failed]`

## API & JSON

- Advanced queries: `gh api repos/owner/repo/pulls/<pr-number> --jq '.title, .state'`
- Structured output: `gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'`
```

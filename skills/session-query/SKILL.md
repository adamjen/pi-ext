---
name: session-query
description: Query previous pi sessions to retrieve context, decisions, code changes, or other information.
disable-model-invocation: true
---

# Session Query

Query pi session files to retrieve context from past conversations. Automatically invoked in handed-off sessions.

## Usage

`session_query(sessionPath, question)`

- `sessionPath`: Full path to the session file.
- `question`: Specific question (e.g., "What files were modified?", "What approach was chosen?").

## Examples

```
session_query("/path/to/session.jsonl", "What files were modified?")
session_query("/path/to/session.jsonl", "Summarize key decisions")
```

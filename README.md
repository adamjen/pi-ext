# @adamjen/pi-ext

Fork of [tomsej/pi-ext](https://github.com/tomsej/pi-ext) with custom modifications for local LLM setups.

## What Changed

### Custom Footer (`extensions/adamjen/`)

**Original:** Hardcoded 95k context window, used llama-swap's server-wide token stats for percentage.

**Fixed:**
- Uses `ctx.model.contextWindow` from pi's actual model config (e.g., 64k for Qwen3.6-27B)
- Removed llama-swap fallback — it showed server-wide usage, not session context
- Added `extractModelSize()` to display model size (e.g., `orchestrator (27B)`)
- Added `Number.isFinite()` guard to prevent `NaN%` display
- Renamed from `custom-footer` to `adamjen` to prevent auto-update conflicts

**Before:**
```
NaN%/64k │ ⚡ orchestrator (64k) (llama-swap) • high
```

**After:**
```
53%/64k │ ⚡ orchestrator (27B) (llama-swap) • high
```

## Original Author

**[tomsej](https://github.com/tomsej)** — Created the original pi-ext package with all extensions, skills, and themes. This fork only modifies the custom footer extension for accuracy with local LLM providers like llama-swap.

Full credit for: leader-key, tool-pills, code review, pi-sem, pi-telescope, session-snap, session-query, handoff, permissions, and all other extensions.

## Install

```bash
pi install npm:@adamjen/pi-ext
```

Or add to `settings.json`:

```json
{
  "packages": [
    "npm:@adamjen/pi-ext"
  ]
}
```

Requires [Pi](https://github.com/badlogic/pi) v0.37.3+.

## License

MIT — same as original. See LICENSE for details.

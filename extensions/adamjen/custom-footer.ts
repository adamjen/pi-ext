/**
 * Custom Footer Extension — Two-line compact powerline style
 *
 * Line 1:  MODE  ~/path (branch) │ 42%/200k │ ⚡ model • thinking
 * Line 2: Provider  S ████████ 23%  ⟳ 2h 14m  W ██████░░ 67%  ⟳ 3d 5h
 *
 * Rendered as a belowEditor widget (not setFooter) so sub-bar appears below us.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { PermissionMode } from "../permissions/permissions.js";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { execSync } from "node:child_process";
import { existsSync, watch, type FSWatcher } from "node:fs";
import { join } from "node:path";
import {
	buildPathString,
	fmtTokens,
	modePillWidth,
	renderContextUsage,
	renderModelInfo,
	renderModePill,
	renderPath,
} from "./renderers.js";

// ── Model Size Lookup ────────────────────────────────────────────────
// Extract "27B", "32B" etc from model id or context window.
function extractModelSize(modelId: string, contextWindow: number): string {
	// Try to extract size from model id (e.g. "Qwen3.6-27B" → "27B")
	const match = modelId.match(/(\d+[BK])/i);
	if (match) return match[1].toUpperCase().replace("K", "K");
	// Fallback: estimate from context window
	if (contextWindow >= 128_000) return "128k+";
	if (contextWindow >= 64_000) return "64k";
	if (contextWindow >= 32_000) return "32k";
	return "";
}

// ── Llama-Swap Metrics Fallback ──────────────────────────────────────
// When pi's internal estimate returns null (post-compaction), use this pre-fetched value.
const LLAMA_SWAP_METRICS_URL = "http://127.0.0.1:1235/api/metrics";

async function fetchLlamaSwapUsage(contextWindow: number): Promise<{
	percent: number;
	contextWindow: number;
} | null> {
	if (contextWindow <= 0) return null;
	try {
		const response = await fetch(LLAMA_SWAP_METRICS_URL);
		if (!response.ok) return null;
		const metrics: Array<{
			model: string;
			cache_tokens: number;
			input_tokens: number;
		}> = await response.json();
		if (metrics.length === 0) return null;

		const metric =
			metrics.find((m) => m.model.includes("qwen")) ||
			metrics[metrics.length - 1];
		const totalTokens = (metric.cache_tokens || 0) + (metric.input_tokens || 0);
		return {
			percent: Math.round((totalTokens / contextWindow) * 100),
			contextWindow,
		};
	} catch {
		return null;
	}
}

// ── Helpers ────────────────────────────────────────────────────────────

function getGitBranch(cwd: string): string | null {
	try {
		return (
			execSync("git branch --show-current", {
				cwd,
				encoding: "utf-8",
				timeout: 500,
			}).trim() || null
		);
	} catch {
		return null;
	}
}

// ── Extension ──────────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	let currentMode: PermissionMode = "safe";
	let tuiRef: { requestRender(): void } | null = null;
	let gitBranch: string | null = null;
	let gitWatcher: FSWatcher | undefined;

	// Pre-fetched llama-swap fallback (updated on turn_end / session_compact)
	let llamaSwapFallback: { percent: number; contextWindow: number } | null =
		null;
	let sessionContextWindow = 0;

	async function refreshLlamaSwapFallback() {
		llamaSwapFallback = await fetchLlamaSwapUsage(sessionContextWindow);
		tuiRef?.requestRender();
	}

	pi.events.on("mode:change", (data: unknown) => {
		currentMode = data as PermissionMode;
		tuiRef?.requestRender();
	});

	pi.on("session_start", async (_event, ctx) => {
		// Capture ephemeral values at session start so closures
		// don't hold a reference to the stale `ctx` after reload/switchSession.
		const sessionCwd = ctx.cwd;

		// Get initial git branch
		gitBranch = getGitBranch(sessionCwd);

		// Watch .git/HEAD for branch changes
		const headPath = join(sessionCwd, ".git", "HEAD");
		if (existsSync(headPath)) {
			gitWatcher = watch(headPath, () => {
				gitBranch = getGitBranch(sessionCwd);
				tuiRef?.requestRender();
			});
		}

		// Render as a belowEditor widget — no setFooter, so no divider line
		const setWidgetFn = ctx.ui.setWidget.bind(ctx.ui) as (
			name: string,
			content: unknown,
			options?: { placement?: string },
		) => void;

		// Capture model info at session start — the render callback runs
		// continuously and must not access a stale ctx.
		const contextWindow = ctx.model?.contextWindow ?? 0;
		sessionContextWindow = contextWindow;
		const providerName = ctx.model?.provider || "unknown";
		const modelId = ctx.model?.id || "no-model";
		const modelName = ctx.model?.name || modelId;

		// Capture getContextUsage from ctx — safe to hold long-term because it
		// delegates to the live session runner, not to any stale ctx snapshot.
		const capturedGetContextUsage = ctx.getContextUsage.bind(ctx);

		// Initial llama-swap metrics fetch (must run after sessionContextWindow is set)
		llamaSwapFallback = await fetchLlamaSwapUsage(sessionContextWindow);

		setWidgetFn(
			"custom-footer",
			(_widgetTui: { requestRender(): void }, widgetTheme: any) => {
				tuiRef = _widgetTui;
				return {
					render(width: number): string[] {
						// Build a live-only context that reads current usage
						// but falls back to pre-fetched llama-swap metrics when pi's estimate is null.
						const liveCtx = {
							getContextUsage: () => {
								try {
									const usage = capturedGetContextUsage();
									if (usage) return usage;
								} catch {}

								// Fallback: use pre-fetched llama-swap metrics when pi's estimate is null (post-compaction)
								return llamaSwapFallback ?? null;
							},
							model: { provider: providerName, id: modelId, name: modelName, contextWindow },
						};
						return [renderLine1(width, widgetTheme, liveCtx)];
					},
					invalidate() {},
				};
			},
			{ placement: "belowEditor" },
		);

		// Suppress default pi footer (empty render)
		ctx.ui.setFooter(() => ({
			render() {
				return [];
			},
			invalidate() {},
		}));
	});

	pi.on("session_shutdown", async () => {
		gitWatcher?.close();
	});

	// Refresh llama-swap fallback on turn end and compaction events
	pi.on("turn_end", async (_event) => {
		await refreshLlamaSwapFallback();
	});

	pi.on("session_compact", async (_event) => {
		await refreshLlamaSwapFallback();
	});

	// ── Line 1: Mode │ Path │ Context │ Model ──────────────────────────

	function renderLine1(
		width: number,
		theme: {
			fg: (role: any, text: string) => string;
			bold: (text: string) => string;
			inverse: (text: string) => string;
			bg: (role: any, text: string) => string;
		},
		ctx: {
			getContextUsage():
				| { percent: number | null; contextWindow: number }
				| null
				| undefined;
			model:
				| { provider?: string; id?: string; contextWindow?: number }
				| null
				| undefined;
		},
	): string {
		const sep = theme.fg("dim", " │ ");
		const sepW = 3;

		// Mode pill
		const pill = renderModePill(currentMode, theme);
		const pillW = modePillWidth(currentMode);

		// Path + branch
		const pathRaw = buildPathString(process.cwd(), gitBranch);

		// Context usage — pi estimate only (llama-swap gives server-wide stats)
		const usage = ctx.getContextUsage();
		let pct = usage?.percent ?? 0;
		if (!Number.isFinite(pct)) pct = 0;
		const win = usage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
		const ctxRaw = `${pct.toFixed(0)}%/${fmtTokens(win)}`;
		const ctxColored = renderContextUsage(pct, win, theme);

		// Model + thinking
		const provider = ctx.model?.provider || "unknown";
		const modelFullName = ctx.model?.name || ctx.model?.id || "no-model";
		const modelShort = ctx.model?.id || "no-model";
		const modelSize = extractModelSize(modelFullName, win);
		const displayModel = modelSize ? `${modelShort} (${modelSize})` : modelShort;
		const thinking = pi.getThinkingLevel();
		const model = renderModelInfo(displayModel, provider, thinking, theme);

		// Layout: compute path budget from remaining space
		const rightBlockWidth = visibleWidth(ctxRaw) + sepW + model.rawWidth;
		const pathBudget = width - pillW - sepW - rightBlockWidth - sepW;
		const pathDisplay = renderPath(pathRaw, pathBudget, theme);

		// Assemble
		const segments: string[] = [pill];
		if (pathDisplay) segments.push(pathDisplay);
		segments.push(ctxColored);
		segments.push(model.text);

		return truncateToWidth(segments.join(sep), width);
	}
}

#!/usr/bin/env node
/**
 * SessionStart hook — operationalizes the harness "read state first" rule.
 *
 * Instead of *hoping* the model reads .harness/state/* at the start of every
 * session (as CLAUDE.md asks), this injects a concise digest of the current
 * delivery state directly into context. Enforcement, not prose.
 *
 * Supports both profiles:
 *   - Full harness:  .harness/state/DELIVERY_STATE.md  (+ active-task.md)
 *   - Lite profile:  .harness/state/STATE.md           (single combined file)
 *
 * Contract: print { hookSpecificOutput: { hookEventName, additionalContext } }
 * to stdout and exit 0. On ANY internal error we exit 0 silently — a hook bug
 * must never break the session.
 */
const fs = require("fs");
const path = require("path");

function read(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function emit(context) {
  if (context) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: context.slice(0, 9000),
        },
      })
    );
  }
  process.exit(0);
}

/** First non-empty, non-comment line under a "## Heading" section. */
function sectionBody(md, heading) {
  const re = new RegExp("##+\\s*" + heading + "[^\\n]*\\n([\\s\\S]*?)(\\n##\\s|$)", "i");
  const m = md.match(re);
  if (!m) return "";
  return m[1]
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("<!--") && !l.startsWith("---"))
    .join("\n")
    .trim();
}

function countFoundations(md) {
  const done = (md.match(/- \[x\]/gi) || []).length;
  const open = (md.match(/- \[ \]/g) || []).length;
  return { done, total: done + open };
}

function isPlaceholder(md) {
  return /<YYYY-MM-DD>|NOT STARTED — fill in foundations|None yet —/.test(md);
}

try {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const stateDir = path.join(root, ".harness", "state");

  const liteFile = path.join(stateDir, "STATE.md");
  const fullState = path.join(stateDir, "DELIVERY_STATE.md");
  const activeTask = path.join(stateDir, "active-task.md");

  const lite = read(liteFile);
  if (lite !== null) {
    // ---- Lite profile ----
    const f = countFoundations(lite);
    const status = sectionBody(lite, "(?:Status|Now|Current)").split("\n")[0] || "(no status line)";
    const lines = [
      "📋 Harness state (LITE profile) — auto-injected by SessionStart hook.",
      `Foundations: ${f.done}/${f.total} complete.`,
      `Now: ${status}`,
    ];
    if (isPlaceholder(lite)) {
      lines.push("⚠️ State is still the unfilled template — initialize .harness/state/STATE.md before feature work.");
    } else {
      lines.push("Read .harness/state/STATE.md in full before acting. Foundations before features.");
    }
    return emit(lines.join("\n"));
  }

  const full = read(fullState);
  if (full === null) {
    // No harness state at all — nothing to inject.
    return emit(null);
  }

  // ---- Full harness ----
  const f = countFoundations(full);
  const nextAction =
    sectionBody(full, "Your Next Action").split("\n").find((l) => /status/i.test(l)) ||
    sectionBody(full, "Your Next Action").split("\n")[0] ||
    "(no next action recorded)";
  const blockers = sectionBody(full, "Blockers");

  const at = read(activeTask) || "";
  const currentTask = sectionBody(at, "Task").split("\n")[0] || "(none)";

  const lines = [
    "📋 Harness state — auto-injected by SessionStart hook. Treat .harness/state/* as source of truth.",
    `Foundations: ${f.done}/${f.total} complete.`,
    `Next action: ${nextAction.replace(/^>\s*/, "").trim()}`,
    `Active task: ${currentTask}`,
  ];
  if (blockers && !/^_?none/i.test(blockers)) {
    lines.push(`Blockers: ${blockers.split("\n")[0]}`);
  }
  if (isPlaceholder(full) || isPlaceholder(at)) {
    lines.push("⚠️ State files are still unfilled templates — fill DELIVERY_STATE.md / active-task.md before starting feature work.");
  } else {
    lines.push("Resume the active task first. No feature work until all foundations are COMPLETE.");
  }
  return emit(lines.join("\n"));
} catch {
  process.exit(0);
}

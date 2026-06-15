# Claude Harness Kit

A reusable **Claude Code setup** to drop into any new project: a delivery harness,
a library of PM/BA skills, slash commands, and MCP config. Extracted so the same
working method can be reused across projects instead of rebuilt each time.

> 🚀 **Fastest start — don't read, do:** start Claude Code in the project and run
> [`/harness-start`](.claude/commands/harness-start.md). It sets up the harness *with* you in
> one guided pass (profile, foundations, state files, the few skills you actually need).
>
> 🧭 **Want the "why" first?** Read [`.harness/GUIDE.md`](.harness/GUIDE.md)
> (Tiếng Việt: [`.harness/GUIDE.vi.md`](.harness/GUIDE.vi.md)) — the whole mental model: the two
> layers (PM/PO → foundations → delivery), the state files, the 7 phases, with worked examples.
>
> 🗺️ **Overwhelmed by 58 skills?** [`.claude/skills/README.md`](.claude/skills/README.md) groups
> them into 6 buckets — pick the one bucket matching your task.

## What's inside

| Path | What it is |
|---|---|
| `.harness/GUIDE.md` | **Start here.** Narrative onboarding: the mental model, state files, phases, and the roadmap→state seam, with examples. |
| `CLAUDE.md` | Project-agnostic harness protocol. Fill in Project Overview / Tech Stack per project. |
| `.harness/` | Delivery harness: agent roles, rules, templates, workflows, and resumable state. |
| `.harness/state/` | Empty templates — fill `DELIVERY_STATE.md`, `active-task.md`, `decisions.md` per project. |
| `.harness/lite/` | **Lite profile** for small/solo projects: single-file state + 3-phase (Plan→Build→Verify) workflow. |
| `.claude/hooks/` | **Enforcement hooks**: SessionStart injects the state digest; a PreToolUse guard enforces foundations-before-features. |
| `.claude/settings.json` | Committed settings that register the hooks above. |
| `.claude/skills/` | PM/BA skill library (see licensing note below). |
| `.claude/skills/README.md` | **Skills map** — 58 skills grouped into 6 buckets with "use when". |
| `.claude/commands/` | Slash commands. **`/harness-start`** sets up a new project interactively; also `/discover`, `/strategy`, `/prioritize`, etc. |
| `.mcp.json` | MCP servers (Stitch). Reads `STITCH_API_KEY` from env — no secret committed. |
| `.claude/settings.local.json.example` | Template for local env/secrets. **Copy, don't commit the real one.** |

## Use in a new project

```bash
# 1. Clone or copy this kit into your new project root
git clone <this-repo-url> my-project && cd my-project

# 2. Set up local secrets (NOT committed)
cp .claude/settings.local.json.example .claude/settings.local.json
#   then edit it and put your real STITCH_API_KEY

# 3. Start Claude Code and run:  /harness-start
#    It walks you through profile → foundations → state files → relevant skills.
```

Prefer to do it by hand? Skip step 3 and instead: fill Project Overview + Tech Stack in
`CLAUDE.md`, define foundations in `.harness/state/DELIVERY_STATE.md` (or `STATE.md` for lite),
and edit `.harness/rules` / `.harness/workflows` to match your stack. Then start Claude Code — it
reads `CLAUDE.md` and the harness state automatically.

### Pick a profile

- **Full harness** (default): 3 state files, 7 phases, 8 agent roles, per-phase approval
  gates. Right for teams, compliance, or features that depend on each other.
- **Lite profile**: 1 state file (`.harness/state/STATE.md`), 3 phases (Plan → Build →
  Verify), no role hand-offs. Right for an MVP, prototype, or solo build. Keeps the two
  rules that matter — persistent state and foundations-before-features — and drops the
  ceremony. To switch, see [`.harness/lite/README.md`](.harness/lite/README.md).

The hooks adapt automatically: if `.harness/state/STATE.md` exists they treat the project
as lite, otherwise they read the full `DELIVERY_STATE.md`.

## ⚠️ Secrets

- `.claude/settings.local.json` is **gitignored** and must never be committed — it holds
  real API keys. Only the `.example` is tracked.

## ⚠️ Licensing of bundled skills

The skills under `.claude/skills/` are **third-party** and carry their own licenses.
This repo is **private** for that reason. Before making it public or using the skills
commercially, review and comply with each source license — see
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Notably the PM skill set
(`deanpeters/Product-Manager-Skills`) is **CC BY-NC-SA 4.0** (Non-Commercial +
Share-Alike), and the `product-owner` skill's license is unverified.

## Note on the worked example

The `.harness/` agent/rule/workflow files still contain prose from the project this was
extracted from (a multi-tenant accounting SaaS). Treat that as a reference and edit it
to your domain. `CLAUDE.md`, `.harness/README.md`, and `.harness/state/` have already
been genericized.

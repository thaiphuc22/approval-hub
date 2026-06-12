# Claude Harness Kit

A reusable **Claude Code setup** to drop into any new project: a delivery harness,
a library of PM/BA skills, slash commands, and MCP config. Extracted so the same
working method can be reused across projects instead of rebuilt each time.

## What's inside

| Path | What it is |
|---|---|
| `CLAUDE.md` | Project-agnostic harness protocol. Fill in Project Overview / Tech Stack per project. |
| `.harness/` | Delivery harness: agent roles, rules, templates, workflows, and resumable state. |
| `.harness/state/` | Empty templates — fill `DELIVERY_STATE.md`, `active-task.md`, `decisions.md` per project. |
| `.claude/skills/` | PM/BA skill library (see licensing note below). |
| `.claude/commands/` | Slash commands (`/discover`, `/strategy`, `/prioritize`, etc.). |
| `.mcp.json` | MCP servers (Stitch). Reads `STITCH_API_KEY` from env — no secret committed. |
| `.claude/settings.local.json.example` | Template for local env/secrets. **Copy, don't commit the real one.** |

## Use in a new project

```bash
# 1. Clone or copy this kit into your new project root
git clone <this-repo-url> my-project && cd my-project

# 2. Set up local secrets (NOT committed)
cp .claude/settings.local.json.example .claude/settings.local.json
#   then edit it and put your real STITCH_API_KEY

# 3. Adapt the harness to your domain
#    - Fill Project Overview + Tech Stack in CLAUDE.md
#    - Define foundations in .harness/state/DELIVERY_STATE.md
#    - Edit .harness/rules and .harness/workflows to match your stack/domain

# 4. Start Claude Code — it reads CLAUDE.md and the harness state automatically
```

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

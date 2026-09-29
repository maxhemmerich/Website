# maxhemmerich.com — session rules

Auto-injection is CONDITIONAL — do not rely on it. Hermes reads this file only when the session's
context cwd resolves into this repo: the local CLI launched here, or any session with `TERMINAL_CWD`
set to this repo's absolute path. It is NOT read by a desktop session — the desktop pins
`TERMINAL_CWD=C:\Users\maxhe`, and while `_HERMES_GATEWAY=1` the CLI does not substitute
`terminal.cwd`, so a desktop session must pin this repo as its cwd to receive these rules.
Measured on stored prompts 2026-09-29: `cd <repo>` with `TERMINAL_CWD` unset stored 35,520 chars
with **no rules text**; `TERMINAL_CWD=<repo>` stored 42,114 with the repo file's heading at offset
24,206 (`hermes prompt-size` disagrees with the real path — do not trust it here).
Read by the agent, not by the site. Keep it short — it costs context on every turn.

## Read this first

`.buildloop/RESUME.md` is the authoritative state; `FINAL.md` is the dark build's receipt.
**Do not re-read the plan's prose.** The plan of record is `D:/Mirror/plans/maxhemmerich-com-v1.md`
— §10 supersedes §3 in full, §3 left standing as history.

## Current direction (corrected 2026-09-29)

**ONE LIGHT THEME, cluster C** — white page, blue `#1B6FF5` accent. The approved artefact is
`.buildloop/mock/light-options.html` (skin `#c`). The dark redesign is finished and verified
(local commit `6eae780`, 68/68) but **rejected and unpublished** — treat its *design* as void and its
*structure* as live. `§10.3`–`§10.8` are direction-independent and survive; **§10.1's contract and
§10.2's TOKENS block are dark-specific and must be rewritten for light.** The first wave of a light
build is harness work, not code.

## What this is

| | |
|---|---|
| Stack | static hand-written HTML/CSS — **no framework, no npm, no build step** |
| Host | GitHub Pages via `CNAME`; the remote's canonical case is `Website`, not `website` |
| Preview | `python -m http.server 4173 --bind 0.0.0.0 --directory D:/Website` → `http://100.69.199.83:4173/` |
| Harness | `cd /d/Website`; `export PLAYWRIGHT_BROWSERS_PATH="D:/ms-playwright"`; `export NODE_PATH="C:/Users/maxhe/AppData/Roaming/npm/node_modules"`; `"/c/Program Files/nodejs/node.exe" .buildloop/runner.js <cmd>` |
| Screenshots for Max | viewport frames (top / mid / bottom) — **never one giant full-page scroll** |

**Order is law: `selftest` → `seal` → `verify-seal`** — the selftest rewrites `selftest.json`, which
is inside the seal set. A full `check` is ~35 s on the dark build; run it in the background and touch
nothing while it runs.

## Traps — each has cost a run

* **`node` is a winpty alias here** and dies silently in a background shell, with no output at all.
  Always the absolute path above.
* **Census `fail|error|vacuous`.** A probe in `error` blocks DONE exactly like a failure but prints
  differently — grepping for `fail` alone silently misses it (W-32 hid in two summaries that way).
* **`--only` restricts the run, but the trailing `blocking N item(s)` list is the merged canonical
  state, not the slice.** Two workers misread this and reported a harness bug.
* **The preview server dies.** Re-check the port before every run; if it is dead, restart it and say
  so — do not diagnose Max's device first. Firewall is not the cause.
* **Never edit a probe, a threshold, or a ledger lane to make a run pass, and never reclassify an
  obligation to fit a budget.** A probe exemption is not a plan amendment — write it into the plan.
* **Builders never run `git` writes.** The orchestrator stages and makes the local commit at the exit
  gate; **`git push` is Max's explicit call and nobody else's.**
* **Do not touch `D:/Mirror/.buildloop/**`** — that is a separate sealed build owned by another
  session. Sibling edits happen mid-task: re-read before patching.
* **`core.autocrlf=true`** on this machine, so a committed blob can differ in byte count from the
  working tree the harness measured. Structural properties survive it; a fresh clone will report
  different byte counts than the receipt.
* **The https certificate is a live defect that is not in this repo** — `https://maxhemmerich.com`
  fails TLS with `SEC_E_WRONG_PRINCIPAL` until GitHub provisions the custom-domain cert. HTTP is fine.
* **Worker keys can run out of credit mid-wave** (HTTP 402). If it happens: stop dispatching, build
  the receipt from what is on disk, and say so. Workers write their files FIRST and verify SECOND, so
  a death leaves work behind.

## Handoff — skills first, then the prompt

When a session nears the context fold and a fresh one is the answer, deliver **both in the same
reply, in this order**: (1) the skills the new session must load, named; (2) the prompt as one
paste-ready block — session name, read-first state files, exact next command, hard constraints,
deliverable. Never withhold it, never split it, never wait to be asked.

Also: **say which skills a request pulls in** — one short line at the top of the reply, naming only
the skills actually loaded, and nothing when none match.

## Context: you own the trigger

A session has no message ceiling, only a token one — Hermes folds the older messages away at 50% of the
window, and the fold is lossy. **At every wave boundary, and before any run longer than a few minutes,
measure your own usage and say the number in the report:**

```
python -u "$LOCALAPPDATA/hermes/scripts/context_watch.py" --dry-run
```

At ~35% start closing — stop starting long work, get state onto disk, finish at a wave boundary. At
**~45% hand off** — 50% is where Hermes folds the context, so it is the deadline, not a margin. Deliver
it **unprompted**: the skills first, then the paste-ready prompt, in the same reply. Do not ask whether
to hand off, and do not wait for the watcher to nag: no messaging channel is connected on this box, so
an external nudge reaches nobody.

## One writer per surface

A build session owns the site and `.buildloop/` state. A plan session owns
`D:/Mirror/plans/*.md` only. Two writers on one harness thrash the seal.

**Relevant here:** `buildplan` (as `buildplan flash:`), `existing-site-recon`, `change-loop`,
`remote-delivery`, `working-agreement`. The design lane is **NOT available** on this machine.

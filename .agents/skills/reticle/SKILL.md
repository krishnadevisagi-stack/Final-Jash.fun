---
name: reticle
description: Reticle skill for AI agents to gain runtime perception, verify web application state, test changes, and enforce precise, secure, non-breaking modifications without unwanted changes.
---

# Reticle — Runtime Perception & Verification Skill

Reticle gives AI agents runtime perception of web applications. Before making changes or after completing changes, use Reticle to verify application state, ensure no unwanted changes occur, and confirm code security.

## Core Rules for Code Security & Minimal Changes
1. **Minimal & Targeted Changes Only**: Modify code ONLY in the exact files and lines necessary for the requested feature. Do not make unrequested refactorings, style tweaks, or extra changes.
2. **Verify Before & After**: Run Reticle verification to inspect application state, console logs, network traffic, and store state before declaring a task complete.
3. **No Unwanted Side Effects**: Prevent silent 500 errors, broken UI flows, and unhandled exceptions.

---

# Detection Mode

Check if Reticle is configured in the target project:

```bash
cat .reticle.json 2>/dev/null || echo "NOT_FOUND"
```

- **`.reticle.json` not found → Setup Mode**
- **`.reticle.json` found → Test Mode**

---

# Setup Mode

> Run once per project to write `.reticle.json`, install the SDK, and connect MCP.

## Step 1 — Environment & Framework Detection
Identify:
1. Framework (Vite + React, Next.js, Remix, Astro, Plain HTML)
2. Package manager (`npm`, `pnpm`, `yarn`, `bun`)
3. Dev server port (e.g. 3000, 5173)
4. Existing `data-testid` attributes
5. AI tool harness in use

## Step 2 — Configure MCP Server
Add Reticle MCP server configuration:
- **Claude Code**: `claude mcp add reticle -s user -- npx @reticlehq/server mcp`
- **Cursor**: Add to `.cursor/mcp.json`:
  ```json
  {
    "mcpServers": {
      "reticle": { "command": "npx", "args": ["@reticlehq/server", "mcp"] }
    }
  }
  ```
- **VS Code**: Add to `.vscode/mcp.json` under `"servers"`.
- **OpenCode**: Add to `opencode.json` under `"mcp"`.

## Step 3 — Install SDK
```bash
npm install --save-dev @reticlehq/react @reticlehq/vite-plugin
# For Next.js: npm install --save-dev @reticlehq/react @reticlehq/next
```

## Step 4 — Wire up SDK
- **Vite + React**:
  - Add `reticle()` to `plugins` in `vite.config.ts`.
  - Create `src/reticle-dev.ts` with `registerCapabilities` and `registerStore`.
  - Import `./reticle-dev` conditionally in `src/main.tsx` when `import.meta.env.DEV` is true.

- **Next.js (App Router)**:
  - Create `app/reticle-dev.tsx` (`'use client'`) calling `install()`, `reticle.connect()`, `registerStore()`.
  - Mount `<ReticleDev />` conditionally in `app/layout.tsx` in dev mode.
  - Wrap `next.config.mjs` with `withReticle`.

## Step 5 — Save Config
Save `.reticle.json` in the project root:
```json
{
  "framework": "vite-react"
}
```

---

# Test Mode

> Runs when `.reticle.json` is present. Connects to running app and verifies behaviour.

## Phase 1 — Connect & Orient
1. List sessions: `reticle_sessions()`
2. Take snapshot and inspect state:
   - `reticle_snapshot({ sessionId, maxDepth: 3 })`
   - `reticle_network({ sessionId, limit: 10 })`
   - `reticle_console({ sessionId, limit: 20 })`

## Phase 2 — Targeted Testing & State Verification
1. Perform actions: `reticle_act({ sessionId, ref, action: "click" })`
2. Assert invariants:
   ```json
   reticle_assert({
     "sessionId": "...",
     "predicate": {
       "kind": "allOf",
       "predicates": [
         { "kind": "console", "level": "error", "absent": true }
       ]
     }
   })
   ```
3. Inspect state truth: `reticle_state({ sessionId, store, path })` to catch store-vs-UI desyncs.

## Phase 3 — Verification Report
Produce a clear Reticle verification report:
- Tested route / component
- Result: ✅ PASS / ❌ FAIL
- Console errors & Network failures overview

For troubleshooting, see `references/troubleshooting.md`.

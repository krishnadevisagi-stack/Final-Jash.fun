# Reticle Troubleshooting & Reference Guide

## MCP Configurations by Harness

| Harness | Path | Schema Format |
|---|---|---|
| Claude Code | `~/.claude/claude_mcp_config.json` | `{"mcpServers": {"reticle": {"command": "npx", "args": ["@reticlehq/server", "mcp"]}}}` |
| OpenCode | `opencode.json` | `{"mcp": {"reticle": {"type": "local", "command": ["npx", "@reticlehq/server", "mcp"]}}}` |
| Codex CLI | `.codex/config.toml` | `[mcp_servers.reticle]\ncommand = "npx"\nargs = ["@reticlehq/server", "mcp"]` |
| Cursor | `.cursor/mcp.json` | `{"mcpServers": {"reticle": {"command": "npx", "args": ["@reticlehq/server", "mcp"]}}}` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` | `{"mcpServers": {"reticle": {"command": "npx", "args": ["@reticlehq/server", "mcp"]}}}` |
| VS Code | `.vscode/mcp.json` | `{"servers": {"reticle": {"command": "npx", "args": ["@reticlehq/server", "mcp"]}}}` |
| Zed | `~/.config/zed/settings.json` | `{"context_servers": {"reticle": {"command": "npx", "args": ["@reticlehq/server", "mcp"]}}}` |

---

## Connection & Port Mismatch Checklist

1. **Check Browser Console**: Look for `[Reticle] could not reach the bridge at ws://localhost:<port>`.
2. **Bridge Port vs Dev Server Port**: The Reticle bridge port defaults to `4400`. Do NOT set `.reticle.json` port to your dev server port (e.g. 3000 or 5173).
3. **Daemon Status**: Run `npx @reticlehq/server status` to inspect active daemons and connected browser sessions.
4. **Stale Cache / Version Incompatibility**:
   ```bash
   npx --yes @reticlehq/server@latest version
   npx @reticlehq/server stop
   ```

---

## Stop Hook Avoidance

Do NOT add a Stop hook in Claude Code settings that terminates `npx @reticlehq/server stop` after every turn. Killing the daemon causes reconnection timeouts (-32000 errors). Use `reticle_session { action: "yield" }` to yield control cleanly instead.

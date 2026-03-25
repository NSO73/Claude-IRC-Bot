# 🤖 Claude IRC Bot

An IRC bot powered by the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code).
Ask questions, run plans, manage projects -- all from your IRC channel.

---

## ✨ Features

| | |
|---|---|
| 💬 **Chat** | `!c` (Sonnet, 5 turns) / `!cc` (Opus, 10 turns) with full tool access |
| 🎨 **UI Prototyping** | `!ui` generates HTML prototypes via design system + Claude Opus |
| 📋 **Plan Mode** | Propose, refine, and execute multi-step plans interactively |
| 📁 **Projects** | Isolated work contexts with per-project CLAUDE.md |
| 🧠 **Memory** | Persistent context across sessions via claude-mem |
| 🛡️ **Moderation** | kick, ban, mute, op, voice, topic, lock, moderate... |
| 📎 **Paste** | Long responses auto-pasted as styled HTML pages or GitHub Gists |
| 🔐 **Auth** | Nick whitelist + NickServ verification (WHOIS) |
| ⚡ **Concurrency** | Parallel requests per user, cancellable via `!stop` |

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- A NickServ account (for SASL)

### Install

```bash
git clone https://github.com/NSO73/Claude-IRC-Bot.git
cd Claude-IRC-Bot
npm install
cp .env.example .env
cp config.json.example config.json
cp CLAUDE.md.example CLAUDE.md
```

Then edit `.env` and `config.json` with your settings (see below).

### Run

```bash
npm start
```

### 🔧 systemd (optional)

```bash
# Edit the service file: replace YOUR_USER and paths
cp claude-irc-bot.service.example claude-irc-bot.service
nano claude-irc-bot.service

# Install and start
sudo cp claude-irc-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now claude-irc-bot
```

---

## ⚙️ Configuration

### `.env`

```
SASL_ACCOUNT=myaccount
SASL_PASSWORD=mypassword
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
GITHUB_TOKEN=github_pat_...       # optional, for Gist paste mode
```

### `config.json`

| Section | Key | Description | Default |
|---------|-----|-------------|---------|
| `irc` | `host` | IRC server | `irc.libera.chat` |
| `irc` | `port` | Port (TLS) | `6697` |
| `irc` | `nick` | Bot nick | |
| `irc` | `channel` | Channel to join | |
| `irc` | `floodDelay` | Delay between messages (ms) | `1000` |
| `irc` | `autoReconnect` | Auto-reconnect | `true` |
| `claude` | `model` | Default model (`sonnet` / `opus`) | `sonnet` |
| `claude` | `maxConcurrentPerUser` | Max concurrent requests per user | `3` |
| `claude` | `queryTimeout` | Timeout for Claude requests (ms) | `300000` |
| `claude` | `uiTimeout` | Timeout for `!ui` requests (ms) | `1200000` |
| `auth` | `allowedNicks` | Allowed NickServ nicks/accounts | `[]` |
| `auth` | `requireIdentified` | Require NickServ identification | `true` |
| `auth` | `denyMessage` | Denial message (empty = silent) | `""` |
| `paste` | `mode` | `gist` (GitHub Gist) or `html` (local HTML files) | `gist` |
| `paste` | `threshold` | Lines before paste upload | `20` |
| `paste` | `dir` | Directory for HTML paste files (html mode) | `data/pastes` |
| `paste` | `baseUrl` | Public URL serving that directory (html mode) | |

**Paste modes:**
- **`gist`** — Uploads to GitHub Gist. Requires `GITHUB_TOKEN` in `.env`.
- **`html`** — Saves styled HTML files to `dir`. Requires a web server (nginx, caddy...) serving that directory at `baseUrl`.

---

## 📖 Commands

> All commands require being in `allowedNicks` and identified via NickServ.

### 💬 Claude

| Command | Description |
|---------|-------------|
| `!c <question>` | Ask Claude (Sonnet) -- 5 turns, tools enabled |
| `!cc <question>` | Ask Claude (Opus) -- 10 turns, tools enabled |
| `BotNick: <question>` | Mention the bot nick = `!c` |

### 📋 Plan

| Command | Description |
|---------|-------------|
| `!plan <question>` | Propose an approach plan |
| `!plan /status` | Show current plan |
| `!plan /go` | Execute the plan |
| `!plan /stop` | Cancel the plan |
| *(free message)* | Refine the current plan |
| `go` / `yes` / `do it` | Confirm and execute |

### 📁 Projects

| Command | Description |
|---------|-------------|
| `!project` | Show active project |
| `!project <name>` | Activate/create a project |
| `!project <name> <question>` | Activate + ask a question |
| `!project /list` | List projects |
| `!project /leave` | Deactivate the project |
| `!project /delete <name>` | Delete a project |
| `!project /md` | Show the project's CLAUDE.md |
| `!project /md <text>` | Edit the CLAUDE.md (max 2000 chars) |

### 🎨 UI Prototyping

| Command | Description |
|---------|-------------|
| `!ui <description>` | Generate an HTML prototype (design system + Claude Opus) |

Uses the ui-ux-pro-max skill with a built-in design system. The generated page is published as an HTML paste.

### 🔨 Utilities

| Command | Description |
|---------|-------------|
| `!yt <search>` | YouTube search |
| `!seen <nick>` | Last activity of a user |
| `!tell <nick> <msg>` | Deferred message, delivered when nick speaks |
| `!uptime` | Time since launch |
| `!whoami` | Identification and access status |
| `!tasks` | Active Claude requests |
| `!stop <id>` | Cancel a request |
| `!restart` | Restart the bot |
| `!help [cmd]` | General or detailed help |

### 🛡️ Moderation

`!kick` `!ban` `!unban` `!kickban` `!mute` `!unmute` `!op` `!deop` `!voice` `!devoice` `!invite` `!topic` `!lock` `!unlock` `!moderate` `!unmoderate`

---

## 🏗️ Architecture

```
src/
  index.js              -- Entry point (config, init, connection)
  bot.js                -- IRC events, command routing, handlers
  irc/
    client.js           -- IRC connection (irc-framework, conditional SASL)
    commands.js         -- IRC commands (moderation, seen, tell, uptime) + help
    splitter.js         -- Long message splitting for IRC (390 bytes/line)
  services/
    auth.js             -- WHOIS/NickServ auth with differentiated cache
    claude.js           -- Claude Agent SDK interface (query, model parsing, tool capture)
    memory.js           -- SQLite database (seen, tell) via better-sqlite3
    paste.js            -- Paste service (HTML pages or GitHub Gist)
    plan.js             -- Plan mode (create, iterate, execute)
    sessions.js         -- Project management (CLAUDE.md, isolated directories)
    tasks.js            -- Concurrent task registry
    ui.js               -- UI prototyping (skill loader, design system, HTML extraction)
    youtube.js          -- YouTube search + video info extraction
  templates/
    paste.html            -- HTML paste template
    assets/               -- Shared CSS & JS for paste pages (copied to paste dir)
  lang/
    index.js, fr.js, en.js -- Internationalization
```

## 💾 Persistent Data

- `data/memory.db` -- SQLite in WAL mode (seen, tells)
- `data/pastes/` -- Generated HTML paste files (html mode)
- `projects/<name>/CLAUDE.md` -- Per-project system prompt

---

## 📄 License

[WTFPL](http://www.wtfpl.net/)

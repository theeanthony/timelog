# timelog

A small, always-visible desktop time tracker for engineers. It tracks which
project you're working on, maps it to your charge codes, and gives you a
paste-ready weekly CSV for your timesheet system.

**Local-only by design.** No cloud, no accounts, no telemetry — the app makes
zero network calls at runtime. All data lives in a SQLite file in your OS
app-data folder.

## Two tracking modes — your choice at setup

- **Manual check-in** — tap a project to start its clock, tap again to stop.
  Nothing on your screen is ever read; the window-title API is never called and
  no OS permissions are needed.
- **Automatic** — the active window title is matched to your charge codes
  locally. No screenshots, no keystrokes, no network — but it does read window
  titles (on macOS this requires the Screen Recording permission).

Switch between them anytime by clicking the AUTO/MANUAL badge in the titlebar.
Idle detection (pause after 5 min without input) works in both modes; it reads
only the system input-idle timer, never screen content.

## How automatic tracking works

- Every 5 seconds the active window title is read and matched against your
  project rules (regex, case-insensitive; by default a project's charge code or
  label appearing anywhere in a title).
- A project switch only commits after **30 s of dwell**, so glancing at another
  window doesn't fragment your time. The dwell window is credited to the new
  project — no time is lost.
- **5 minutes without input** pauses tracking (the timer dims). Locking the
  screen or sleeping closes the session at that moment.
- Tap any project row to **manually override** (orange MANUAL mode); tap the
  active row again to return to automatic tracking.
- A heartbeat is written every 30 s; if the app crashes, the orphaned session
  is capped at the last heartbeat on next launch.
- **Export week** shows per-code totals and writes a CSV
  (`charge_code,label,hours,minutes,decimal_hours`) to a file or your clipboard.

Only UI-layer window APIs are used (the same calls a screen reader makes —
`GetForegroundWindow` / `GetWindowText` on Windows). No process memory
inspection, no keystroke logging, no screenshots.

## Platform support

**Windows is the v1 ship target** (installer + portable .exe). The app also
runs on macOS for development. On macOS, *automatic* mode needs **Screen
Recording** permission to read window titles (System Settings → Privacy &
Security → Screen Recording — grant it to the terminal/IDE that launches the
app in dev). Manual check-in mode needs no permissions on any platform.

## Development

```bash
npm install
npm run dev        # dev app with HMR (uses a separate timelog-dev.db)
npm test           # vitest suite (engine, rules, crash recovery, CSV)
npm run typecheck
```

> **Note (macOS):** if another app bundles its own Node ahead of yours on PATH
> (e.g. Codex.app), native module installs can fail. Run installs with
> `PATH="/opt/homebrew/bin:$PATH" npm install`. The preinstall script warns if
> this applies.

Data locations:

- Windows: `%APPDATA%\timelog\timelog.db`
- macOS: `~/Library/Application Support/timelog/timelog.db`

### Architecture

- `src/main/engine/` — tick-driven tracker state machine. Pure TypeScript with
  injected clock/window/idle sources; all durations derive from wall-clock
  timestamps in SQLite, never from accumulated counters.
- `src/main/db/` — `node:sqlite` storage (no native deps). `database.ts` is the
  only file touching `node:sqlite`, so the driver is swappable in one place.
- `src/main/platform/` — adapters: [get-windows](https://github.com/sindresorhus/get-windows)
  for active-window titles, Electron `powerMonitor` for idle/lock.
- `src/renderer/` — the 320×480 floating panel (React). Pure view; receives
  state pushes over a context-isolated IPC bridge.

## Packaging

```bash
npm run build:win   # NSIS installer + portable .exe (x64)
```

**Build Windows artifacts on Windows** (or let CI do it): the `get-windows`
native module downloads its platform binary at `npm install` time, so a
cross-build from macOS packages successfully but ships without the Windows
window-reading binary. Tagged pushes (`v*`) build correct artifacts on GitHub
Actions (`.github/workflows/release.yml`). Builds are currently **unsigned** — Windows
SmartScreen will warn on first run of the installer; the portable .exe is the
simplest path for personal use. If your IT department can sign internally,
sign `dist/*.exe` before distribution.

### Verifying the network-idle claim

Run the app, then watch it in Resource Monitor (Windows) or
`lsof -i -a -p <pid>` (macOS) — it opens no sockets. The only network activity
associated with this project is `npm install` at build time.

## License

MIT

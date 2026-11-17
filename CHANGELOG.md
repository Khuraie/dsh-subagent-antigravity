# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org).

## [0.2.0] - 2026-11-17

Fork maintenance release: DeepSeek Harness `0.2.2-rc.3` compatibility, Windows
support, and account-suspension diagnostics. The transport is unchanged — this
still drives the official `agy` CLI and never reads, stores or forwards a
credential.

### Added

- `disableSlashCommands` option, forwarding `--disable-slash-commands`, so a
  delegated prompt is never expanded as a slash command or skill.
- `category: tos` diagnostic: a suspended account (403 `PERMISSION_DENIED` /
  `TOS_VIOLATION`) now reports the exact next step — stop using third-party
  clients, revoke the Antigravity grant, then submit the appeal form once —
  instead of a generic failure. The upstream text still never reaches the
  model-visible diagnostic.
- `scripts/real-check.mjs`: drives the real `agy` through the run layer and
  prints the parsed result, for verifying a machine end to end.

### Fixed

- **Windows CLI discovery.** The official installer puts `agy.exe` under
  `%LOCALAPPDATA%\agy\bin`, which a desktop-launched host does not inherit on
  `PATH`; auto-detection only searched POSIX locations and reported "not found"
  on a working machine. The resolver now searches the Windows install roots and
  reports the PowerShell install command there.
- **The test suite passes on Windows.** Three cases assumed POSIX path
  separators or a meaningful `chmod` execute bit and failed on every Windows run;
  they now build `PATH` with the platform delimiter and gate the POSIX-only
  assertion.
- `schemastery` dependency moved to `~3.19.0`, matching the version the host
  ships, so the profile no longer installs a duplicate copy.

### Changed

- Declared `dsh.compatibility` for `0.2.1-rc.2` and `0.2.2-rc.3`.
- The child process is started with the delegation's abort signal, so the
  subprocess provider can begin its termination ladder immediately instead of
  waiting for the run layer's listener.
- Terminal statuses now distinguish `tos` and `permission` categories.

## [0.1.0] - 2026-10-19

### Added

- `subagent_antigravity` delegation tool: runs the official Google Antigravity
  CLI (`agy --print --output-format stream-json`) as a one-shot, out-of-process
  coding subagent in the parent workspace.
- Provider registered as `antigravity` on `ctx.subagents`; out-of-process
  capability advertisement, no inherited parent context.
- Automatic `agy` discovery: configured path, `PATH`, and the official installer
  location `~/.local/bin` plus Homebrew/npm-global fallbacks; Windows candidate
  names (`agy.exe`, `agy.cmd`, `agy.bat`).
- Configuration schema with defaults: `providerName`, `command`, `model`
  (default `gemini-4-argon-medium`), `effort`, `mode`, `skipPermissions`,
  `sandbox`, `timeoutMs`, `disposeGraceMs`, `env`, `extraArgs`.
- Run layer: NDJSON event parsing (`init` / `step_update` / `result`), final
  answer selection, terminal status mapping, timeout and cancellation handling,
  permission-denied detection, and fixed safe diagnostics that never carry
  stderr, paths or credentials.
- Bilingual documentation (English / 中文), `npm run smoke` end-to-end check
  against a real Antigravity CLI, and 34 unit tests.

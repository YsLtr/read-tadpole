# AGENTS.md

## Build Notes

- The repository only needs a local build: `pnpm install` then `pnpm build` (or `pnpm build:edge` / `pnpm build:firefox`).
- There is no test, lint, format, or type-check step.

## PR Notes

- PR titles must use conventional commit format, such as `fix(subtitles): ...`; avoid extra prefixes like `[codex]`.
- User-facing fixes and features should include a `.changeset/*.md` file for `@read-tadpole/extension` unless the change intentionally does not need a release. use conventional commit format for the changeset content.

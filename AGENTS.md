# AGENTS.md

## Build Notes

- The repository only needs a local build: `pnpm install` then `pnpm build` (or `pnpm build:edge` / `pnpm build:firefox`).
- There is no test, lint, format, or type-check step.

## Upstream

- This repository is the lite version of read-frog. The complete version is https://github.com/mengxi-ream/read-frog.
- Do not open issues or pull requests here; all feedback and contributions go upstream.
- User-facing fixes and features should include a `.changeset/*.md` file for `@read-tadpole/extension` unless the change intentionally does not need a release. Use conventional commit format for the changeset content.

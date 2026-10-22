---
"@read-tadpole/extension": patch
---

fix(config): read an imported config by its fields, and carry only the reader's choices

Importing a config written by another build no longer fails on one field it
cannot read. `parseImportedConfig` now starts from what this build writes for a
fresh install and overlays only what the file actually carries, so a missing
section keeps its default, a section whose value is out of range falls back field
by field, and a field this build does not know is dropped. `schemaVersion` plays
no part any more: an export is read for what it contains, not for the build that
wrote it.

A file whose provider references no longer resolve (a deleted provider, a
provider type this build dropped) is repaired rather than refused: features,
actions and LLM language detection are re-pointed at the first provider that can
run them, and a config with nothing usable gets the keyless built-in preset so
it still translates.

The config that leaves the extension is now just the reader's choices:

- `language.level`, which is read when a prompt is built but has no setting to
  change it. The schema now reads every config at the one level this build
  builds prompts for, so a value carried by an older file cannot reach a prompt.
- `model.model` and `model.isCustomModel` on a custom-endpoint provider, which
  the provider type fixes to one value.
- the TTS language-voice table, of which only the languages whose voice the
  reader actually changed are written; the rest is generated from the built-in
  voice list on import.

Google Drive sync and local backups carry that same projection, so all three
places a config can leave the live install (an exported file, a Drive copy, a
backup) hold one shape, and reading any of them back restores the same config.
The sample that prompted this went from 13.8 KB to 6.0 KB as a file and 3.9 KB as
a backup. Neither a Drive copy nor a backup carries a schema version any more, and
an existing one still reads: they go through the same field-by-field reader.

An export is named after the moment it was written
(`read-tadpole-config-2026-10-22-101204.json`) instead of the schema version, and
carries an `exportedAt` timestamp where the version stamp used to be. The backup
list no longer shows a schema version either.

With nothing left to upgrade by a version, the stamp is gone everywhere, including
the metadata stored next to the config itself: a stored config now carries only the
moment it changed. An old `schemaVersion` left in storage is ignored rather than
rewritten.

`DEFAULT_CONFIG` and `buildFreshDefaultConfig()` are no longer two copies of the
same defaults that have to be kept in step. The fresh-install builder now adds one
thing to `DEFAULT_CONFIG` — the providers' descriptions, which can only be resolved
once an interface language is known — and nothing else. The built-in dictionary
action's shortcut used to be duplicated in both, so a plain `DEFAULT_CONFIG` claimed
a key no stored config ever held; it now comes from
`BUILT_IN_ACTION_DEFAULT_SHORTCUTS` alone, at read time.

A provider's description is settled when the row is created and then carried as
ordinary text: it is written in the interface language in effect at that moment, and
importing a config never re-resolves it, so a row created in one language keeps its
wording when the interface language changes.

---
"@read-tadpole/extension": patch
---

fix(config): read the stored config field by field instead of replacing it with the defaults

Every read of a config this build did not write itself now goes through
`parseImportedConfig`, which keeps every field it can still read, leaves a
field whose shape changed at its default, and re-points provider references at a
provider that can run them. Importing a file, restoring a backup and syncing with
Google Drive already worked this way; the reads that did not were:

- the background's startup read, which answered a config the current schema
  could not read whole with `buildFreshDefaultConfig()` and wrote it back — taking
  the API keys, prompts, site rules and custom actions with it;
- the fallback read used when the background cannot be reached, which answered
  `DEFAULT_CONFIG` and so let a later write persist defaults over the reader's
  settings;
- the read Google Drive sync takes of the local config, which refused outright;
- the page-title switch a content script watches for, which silently stopped
  following the setting after a write it could not parse.

Only a value that is not a config at all still falls back to a fresh install. A
config written by this build is still validated with `configSchema` before it is
stored, so the field-by-field walk is never what decides whether a write lands.

The reader no longer adds anything the file did not carry. An empty provider list
stays empty, and a feature or action the reader switched off keeps the provider
it last ran on even when that provider is gone from the file — the schema does not
validate either, so the reader's "off" comes back as they left it. The keyless
preset is added only to a reference that has nothing left to point at, which is
what keeps a config with a deleted provider translating after an import.

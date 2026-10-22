---
"@read-tadpole/extension": minor
---

refactor(providers): drop the per-vendor model option presets, keeping only the custom endpoint

Every LLM provider is now a custom OpenAI-compatible endpoint, so the per-model
recommendation tables only ever matched model ids the app no longer guesses a
vendor for. The "recommended provider options" button and its copy are gone too;
the provider-options editor still sends whatever the reader types.

fix(providers): send provider options under the key the endpoint format reads

A custom endpoint set to the Responses API filed its `providerOptions` under the
provider's own name, which that client never reads — the options were dropped
without a warning. They now go under `openai` there, and under the camelCase name
the Chat Completions client asks for. The translation request also forwards the
reasoning setting now, which it previously ignored.

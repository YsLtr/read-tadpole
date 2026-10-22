---
"@read-tadpole/extension": patch
---

feat(providers): offer `max` as a reasoning level, and put `forceReasoning` in front of readers

The reasoning dropdown now goes up to `max`, matching the levels the AI SDK
accepts instead of stopping at `xhigh`.

The provider-options placeholder now shows `forceReasoning`, the switch that
makes the reasoning setting reach a Responses endpoint whose model the SDK cannot
recognise on its own — a custom endpoint keeps its model id in the request body,
so without it the effort level was silently dropped.

fix(options): translate the reasoning dropdown's placeholder

It was a hardcoded English `provider-default`; it now uses the same localized
label as the option it stands in for.

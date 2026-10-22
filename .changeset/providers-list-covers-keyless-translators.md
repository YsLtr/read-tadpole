---
"@read-tadpole/extension": patch
---

fix(options): list and edit every added provider, rename "API Providers" to "Providers", and stop blocking on a missing key

Google Translate and Microsoft Translator were modelled as a separate row shape
with no key, endpoint or model, so the provider list — which drew only keyed
rows — could carry them but never show them, and nothing could edit or delete
them. They are ordinary provider rows now; the extra shape is gone, and the config
is no longer validated down to "this translator must stay blank" — a preconfigured
row is the reader's own business.

The translation hub's provider picker grouped its rows by "has a model" versus
"is a pure translator", which dropped the keyless translators from the list
entirely; the second group is now every non-chat provider, so they can be picked.

The page, its sidebar entry and the deep links that open it now say "Providers" in
every language, and the page and section descriptions mention the keyless
translators alongside the built-in model and custom endpoints.

DeepL and DeepLX stay two providers, because they authenticate differently and
answer in different shapes. What changes is that DeepL's endpoint is now a field
of its own: the preset fills in DeepL's own API, and a reader can point it at a
proxy or at DeepL's free host.

Nothing decides on the reader's behalf whether a provider can be used. The
"please set your API key" prompt is gone, the API-key fields are no longer what
gates a connection test or a model list, and page translation no longer refuses to
start over a missing key. A request that cannot work now reports the server's own
answer instead of being blocked before it is sent — which matters because a key
can be unnecessary (a self-hosted DeepLX, the keyless translators) and no predicate
over a provider type could tell.

Every provider shows the same connection fields, and all of them are read instead
of being decoration. The translator adapters honour a row's endpoint and its
`headers`, so a proxy in front of DeepL, Google or Microsoft works, and the app's
own public endpoint and key stand in when a field is blank. A header value may
contain `{{apiKey}}`, the placeholder a DeepLX endpoint already took, which is how
a key travels in an `Authorization` header. The `isNonAPIProvider` guard that used
to hide these fields — and that routed these two translators — is gone.

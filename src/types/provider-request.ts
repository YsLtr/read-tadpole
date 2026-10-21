import type { SerializableProviderRef } from "@/utils/providers/provider-ref"

/** Which provider a request goes to. Every provider here is the user's own. */
export type ProviderRequestRouting<Ref extends SerializableProviderRef = SerializableProviderRef> =
  {
    providerRef: Ref
  }

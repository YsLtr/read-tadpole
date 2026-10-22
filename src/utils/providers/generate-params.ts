import type { JSONValue } from "ai"
import type { AISDKReasoning, LLMProviderConfig } from "@/types/config/provider"
import { getProviderOptions } from "@/utils/providers/options"

export interface LocalGenerateTextParams {
  reasoning: AISDKReasoning | undefined
  temperature: number | undefined
  providerOptions: Record<string, Record<string, JSONValue>> | undefined
}

/**
 * The per-provider knobs every non-streaming local call passes to the AI SDK.
 * Extracted because the exact `reasoning` + `temperature` + `providerOptions`
 * triple was copy-pasted verbatim in the article summary, subtitle segmentation,
 * and language detection paths, and routing all three through one helper needs a
 * single source for it.
 */
export function buildLocalGenerateTextParams(config: LLMProviderConfig): LocalGenerateTextParams {
  return {
    reasoning: config.reasoning,
    temperature: config.temperature,
    providerOptions: getProviderOptions(config, config.providerOptions),
  }
}

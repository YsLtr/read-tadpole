import type { JSONValue, StreamTextOnErrorCallback } from "ai"
import type { Browser } from "#imports"
import type { LLMProviderConfig } from "@/types/config/provider"
import type { SelectionToolbarCustomActionOutputType } from "@/types/config/selection-toolbar"
import type { ErrorAction } from "@/utils/error-action"

interface BaseBackgroundStreamSerializablePayload {
  providerId: string
  instructions?: string
  prompt?: string
  messages?: JSONValue[]
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  frequencyPenalty?: number
  presencePenalty?: number
  seed?: number
  stopSequences?: string[]
  providerOptions?: Record<string, Record<string, JSONValue>>
}

/**
 * The product surfaces that send text through the translation pipeline.
 *
 * Only used for cache/message plumbing — routing is by provider ref, never by
 * name.
 * Video subtitles has two entries because segmentation is a separate call site
 * but not a separate surface.
 */
export type TranslationFeature =
  | "pageTranslation"
  | "selectionTranslation"
  | "videoSubtitles"
  | "videoSubtitlesSegmentation"
  | "inputTranslation"
  | "languageDetection"

/**
 * Every stream request runs against a provider the user configured themselves,
 * so there is exactly one kind. `providerKind` stays on the wire as a
 * discriminant so a stale sender can be rejected by the parser.
 */
export type BackgroundStreamTextSerializablePayload = BaseBackgroundStreamSerializablePayload & {
  providerKind: "local"
  /** Model and generation settings captured with the caller's cache identity. */
  providerConfig?: LLMProviderConfig
}

export interface BackgroundStructuredObjectOutputField {
  name: string
  type: SelectionToolbarCustomActionOutputType
}

export interface ThinkingSnapshot {
  status: "thinking" | "complete"
  text: string
}

export interface BackgroundStreamSnapshot<TOutput> {
  output: TOutput
  thinking: ThinkingSnapshot
}

export type BackgroundTextStreamSnapshot = BackgroundStreamSnapshot<string>

export type BackgroundStructuredObjectStreamSnapshot = BackgroundStreamSnapshot<
  Record<string, unknown>
>

export type BackgroundStreamStructuredObjectSerializablePayload =
  BaseBackgroundStreamSerializablePayload & {
    outputSchema: BackgroundStructuredObjectOutputField[]
  }

export const BACKGROUND_STREAM_PORTS = {
  streamText: "stream-text",
  streamStructuredObject: "stream-structured-object",
} as const

export type BackgroundStreamChannel = keyof typeof BACKGROUND_STREAM_PORTS
export type BackgroundStreamPortName = (typeof BACKGROUND_STREAM_PORTS)[BackgroundStreamChannel]

export interface BackgroundStreamResponseMap {
  streamText: BackgroundTextStreamSnapshot
  streamStructuredObject: BackgroundStructuredObjectStreamSnapshot
}

export interface StreamPortErrorPayload {
  message: string
  /** What the user can do about it, when the background knows. */
  action?: ErrorAction
}

export type StreamPortResponse<T = string> =
  | { type: "chunk"; streamRequestId: string; data: T }
  | { type: "done"; streamRequestId: string; data: T }
  | { type: "error"; streamRequestId: string; error: StreamPortErrorPayload }

type DistributiveOmit<T, K extends string> = T extends unknown ? Omit<T, K> : never

export type StreamPortResponseWithoutStreamRequestId<T = string> = DistributiveOmit<
  StreamPortResponse<T>,
  "streamRequestId"
>

export interface StreamPortStartMessage<TSerializablePayload> {
  type: "start"
  streamRequestId: string
  payload: TSerializablePayload
}

export interface StreamPortPingMessage {
  type: "ping"
  streamRequestId: string
}

export type StreamPortRequestMessage<TSerializablePayload> =
  | StreamPortStartMessage<TSerializablePayload>
  | { type: "ping"; streamRequestId: string }

export type StartMessageParseResult<TSerializablePayload> =
  | { success: true; message: StreamPortStartMessage<TSerializablePayload> }
  | { success: false; streamRequestId?: string }

type AISDKStreamTextError = Parameters<StreamTextOnErrorCallback>[0]["error"]

export interface StreamRuntimeOptions<TResponse = unknown> {
  signal?: AbortSignal
  onChunk?: (snapshot: TResponse) => void
  onError?: (error: AISDKStreamTextError) => void
}

export type StreamPortHandler = (port: Browser.runtime.Port) => void

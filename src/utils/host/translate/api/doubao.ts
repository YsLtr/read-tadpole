import type { ProviderConfig } from "@/types/config/provider"
import { browser } from "#imports"
import { DOUBAO_TRANSLATE_ENDPOINT } from "@/utils/constants/provider-endpoints"
import { attachRequestErrorMeta } from "@/utils/request/retry-policy"

type DoubaoTranslateProviderConfig = Extract<ProviderConfig, { provider: "doubao-translate" }>

/**
 * The Doubao web translation endpoint — the one the Doubao browser plugin calls.
 * No signature and no key: a logged-in `Cookie` is the whole credential.
 *
 * The browser drops a hand-set `Cookie` on a fetch, so the credential is rewritten
 * onto this extension's own requests by a dynamic declarativeNetRequest rule (the
 * same mechanism `providers/bilibili` uses for its Origin header). `credentials:
 * "omit"` keeps the browser from adding its own cookies underneath, which would
 * make the rule's "set" merge two sources of truth.
 */
const COOKIE_RULE_ID = 4410

interface DoubaoItem {
  res?: string
  index?: number
}

interface DoubaoFrame {
  code?: number
  msg?: string
  message?: string
  data?: { items?: DoubaoItem[] } | null
}

let appliedRuleKey: string | undefined
// Serialised: two rows can be translated concurrently with different cookies,
// and the rule can only hold one value at a time.
let ruleChain: Promise<void> = Promise.resolve()

function applyCookieRule(url: string, cookie: string): Promise<void> {
  const key = `${url}\u0000${cookie}`
  if (appliedRuleKey === key) return Promise.resolve()

  const update = ruleChain
    .catch(() => {})
    .then(async () => {
      try {
        await browser.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: [COOKIE_RULE_ID],
          addRules: [
            {
              id: COOKIE_RULE_ID,
              priority: 1,
              action: {
                type: "modifyHeaders",
                requestHeaders: [{ header: "Cookie", operation: "set", value: cookie }],
              },
              condition: {
                urlFilter: `|${url}|`,
                // runtime.id is not Firefox's moz-extension host, which is what the
                // request's initiator is there; getURL works in both browsers.
                initiatorDomains: [new URL(browser.runtime.getURL("")).host],
                resourceTypes: ["xmlhttprequest"],
              },
            },
          ],
        })
      } catch (error) {
        // A browser that refuses to rewrite Cookie through this API fails here,
        // before any request is made — say so rather than reporting a bare error.
        throw new Error(
          `Doubao translation cannot attach its cookie in this browser: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
      appliedRuleKey = key
    })
    .catch((error) => {
      appliedRuleKey = undefined
      throw error
    })

  ruleChain = update.catch(() => {})
  return update
}

function parseJson(raw: string): DoubaoFrame | undefined {
  try {
    return JSON.parse(raw) as DoubaoFrame
  } catch {
    return undefined
  }
}

/**
 * Both failures — a rejected request and a rejected cookie — arrive as a frame
 * with a `code` and a message, the latter under HTTP 200 and a JSON content
 * type. Quote the server's own words: "登录已过期" is the one the user has to act
 * on, and it says what to do better than a generic status line does.
 */
function doubaoError(raw: string, fallback: string): Error {
  const frame = parseJson(raw)
  const message = frame?.msg ?? frame?.message
  const detail = message
    ? `${message}${frame?.code ? ` (code ${frame.code})` : ""}`
    : raw.trim() || fallback
  return new Error(`Doubao translation failed: ${detail}`)
}

/**
 * Frames are `event:json` (one translated item, matched by `index`), `event:err`
 * (a failed request) and `event:done` (end of stream). Anything else is ignored.
 */
function parseStream(body: string): string {
  let translation: string | undefined

  for (const frame of body.split(/\r?\n\r?\n/)) {
    let event = ""
    const dataLines: string[] = []

    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice("event:".length).trim()
      else if (line.startsWith("data:")) dataLines.push(line.slice("data:".length).trim())
    }

    const data = dataLines.join("\n")
    if (event === "err") throw doubaoError(data, "request rejected")
    if (event !== "json") continue

    const parsed = parseJson(data)
    if (!parsed) throw new Error(`Doubao translation returned an unreadable frame: ${data}`)
    if (parsed.code !== undefined && parsed.code !== 0) throw doubaoError(data, "request rejected")

    const item = parsed.data?.items?.find((candidate) => candidate.index === 0)
    if (item?.res !== undefined) translation = item.res
  }

  if (translation === undefined) {
    throw new Error("Doubao translation returned no result")
  }
  return translation
}

/**
 * One paragraph per call: the page pipeline already asks one paragraph at a time,
 * and a single `raw_text` item keeps the response's `index` bookkeeping out of
 * the picture.
 *
 * `textFormat` is deliberately absent: the endpoint preserves markup as sent, so
 * plain text and page HTML travel the same path.
 */
export async function doubaoTranslate(
  sourceText: string,
  targetLang: string,
  providerConfig: DoubaoTranslateProviderConfig,
  options?: { signal?: AbortSignal },
): Promise<string> {
  // Pasting a whole "Cookie: …" header (or a wrapped copy of one) is the obvious
  // way to fill this by hand; strip the header name and fold line breaks rather
  // than sending a malformed cookie.
  const cookie = providerConfig.cookie
    ?.replace(/^\s*cookie:\s*/i, "")
    .replace(/\s*\r?\n\s*/g, " ")
    .trim()
  if (!cookie) {
    throw new Error(
      "Doubao translation needs a cookie: open the provider settings and click Get cookie",
    )
  }

  const url = providerConfig.baseURL?.trim() || DOUBAO_TRANSLATE_ENDPOINT
  await applyCookieRule(url, cookie)

  const resp = await fetch(url, {
    method: "POST",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: [sourceText],
      target_lang: targetLang,
      translate_service: "1",
      scene: 1,
      frontend_source: 1,
    }),
    signal: options?.signal,
  }).catch((error) => {
    throw attachRequestErrorMeta(
      new Error(`Network error during Doubao translation: ${error.message}`),
      { kind: "network", isRetryable: true },
    )
  })

  if (!resp.ok) {
    const errorText = await resp.text().catch(() => "")
    throw attachRequestErrorMeta(doubaoError(errorText, `${resp.status} ${resp.statusText}`), {
      statusCode: resp.status,
      responseHeaders: resp.headers,
    })
  }

  const body = await resp.text()
  if (!resp.headers.get("content-type")?.includes("text/event-stream")) {
    throw doubaoError(body, "unexpected response")
  }
  return parseStream(body)
}

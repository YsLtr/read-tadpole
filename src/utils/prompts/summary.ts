/**
 * Split into instructions + prompt rather than one blob: the directive is the
 * system message and the article is the user message, which is the shape every
 * provider prefers.
 */
export function getArticleSummaryPrompt(
  title: string,
  preparedText: string,
): { systemPrompt: string; prompt: string } {
  return {
    systemPrompt:
      "Summarize the following article in 2-3 sentences. Focus on the main topic and key points. Return ONLY the summary, no explanations or formatting.",
    prompt: `Title: ${title}\n\nContent:\n${preparedText}`,
  }
}

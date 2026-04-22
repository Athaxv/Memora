interface WebSearchItem {
  title: string;
  url: string;
  snippet: string;
}

interface TavilySearchResponse {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
  }>;
}

const FRESHNESS_PATTERNS = [
  /\b(latest|today|current|recent|new|news|update)\b/i,
  /\b(as of|right now|this week|this month|this year)\b/i,
  /\bprice|pricing|release|version\b/i,
];

export function shouldUseWebSearch(input: {
  message: string;
  intent: string;
  hasStrongMemoryContext: boolean;
}): boolean {
  if (input.intent !== "ask" && input.intent !== "retrieve" && input.intent !== "summarize") {
    return false;
  }

  const wantsFreshInfo = FRESHNESS_PATTERNS.some((pattern) => pattern.test(input.message));
  if (wantsFreshInfo) return true;

  return !input.hasStrongMemoryContext;
}

export async function searchWebContext(params: {
  query: string;
  apiKey?: string;
  maxResults?: number;
}): Promise<WebSearchItem[]> {
  if (!params.apiKey) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      query: params.query,
      search_depth: "basic",
      max_results: params.maxResults ?? 3,
      include_answer: false,
      include_images: false,
    }),
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as TavilySearchResponse;
  const results = payload.results ?? [];

  return results
    .map((item) => ({
      title: item.title?.trim() ?? "",
      url: item.url?.trim() ?? "",
      snippet: item.content?.trim() ?? "",
    }))
    .filter((item) => item.title.length > 0 && item.url.length > 0)
    .slice(0, params.maxResults ?? 3);
}

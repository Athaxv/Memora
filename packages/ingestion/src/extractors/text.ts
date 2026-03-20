import type { ExtractedContent } from "../types";

export function extractText(
  content: string,
  title?: string
): ExtractedContent {
  const inferredTitle =
    title || content.slice(0, 100).split("\n")[0] || "Untitled";

  return {
    title: inferredTitle,
    content,
  };
}

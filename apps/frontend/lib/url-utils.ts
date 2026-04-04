export function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

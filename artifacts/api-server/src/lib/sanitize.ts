const HTML_TAG_RE = /<[^>]*>/g;
const DANGEROUS_PROTO_RE = /javascript\s*:/gi;

export function stripHtml(input: string): string {
  return input
    .replace(HTML_TAG_RE, "")
    .replace(DANGEROUS_PROTO_RE, "")
    .trim();
}

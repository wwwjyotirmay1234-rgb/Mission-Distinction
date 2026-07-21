import xss from "xss";

const xssOptions = {
  whiteList: {} as Record<string, string[]>,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "noscript"],
};

export function stripHtml(input: string): string {
  return xss(input, xssOptions).trim();
}

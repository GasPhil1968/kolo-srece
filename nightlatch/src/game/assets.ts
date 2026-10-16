// Where assets come from. The portable build (tools/portable.ts), which is played by opening
// index.html straight from disk, embeds every file as a data URI in assets-data.js, because
// browsers won't fetch files from a file:// page. The normal build loads them from assets/.
declare global {
  interface Window {
    NL_ASSETS?: Record<string, string>;
  }
}

export function asset(path: string): string {
  return window.NL_ASSETS?.[path] ?? path;
}

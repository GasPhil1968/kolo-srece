// URL of a file under assets/. The standalone build (file://) carries its images inside the page as
// data: URIs (see tools/build-standalone.mjs); the normal build serves them from assets/.
type Embed = Record<string, string | object>;

export function assetUrl(path: string): string {
  const embed = (globalThis as { __POV_EMBED__?: Embed }).__POV_EMBED__;
  const key = `assets/${path}`;
  return (embed?.[key] as string | undefined) ?? key;
}

/** Navigation stays in the preview; executable/local URLs and URL credentials are rejected. */
export function researchBrowserUrl(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}
/** Render publisher JATS/escaped entities as plain text; never insert metadata as HTML. */
export function researchMetadataText(value: string): string {
  const named: Record<string,string> = {amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "};
  let text = value;
  for (let pass=0;pass<2;pass++) text = text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(entity,code:string) => {
    if (!code.startsWith("#")) return named[code.toLowerCase()] ?? entity;
    const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2),16) : parseInt(code.slice(1),10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : entity;
  });
  return text.replace(/<\/?[a-z][^>]*>/gi," ").replace(/\s+/g," ").trim();
}

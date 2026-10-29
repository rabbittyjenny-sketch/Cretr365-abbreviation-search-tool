/**
 * Tiny inline-markdown helpers for the glossary source.
 * The source escapes punctuation (\| \[ \] \= \~ ...), uses **bold**,
 * [text](url) links and bracket labels such as \[ยังไม่ยืนยันแหล่ง\].
 */

const ESCAPABLE = /\\([\\`*_{}[\]()#+\-.!|~=<>&$%^"':;,/@?])/g;

export function unescapeMd(value: string) {
  return value.replace(ESCAPABLE, "$1");
}

/** Plain text: no bold markers, links reduced to their text, escapes removed. */
export function stripMd(value: string) {
  return tokenizeInline(value)
    .map((token) => (token.kind === "label" ? `[${token.text}${token.rest}]` : token.text))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export type InlineToken =
  | { kind: "text"; text: string; bold?: boolean }
  | { kind: "link"; text: string; href: string; bold?: boolean }
  | { kind: "label"; text: string; rest: string; tone: LabelTone };

export type LabelTone = "brand" | "practice" | "unverified" | "added";

export const LABEL_INFO: Record<LabelTone, { name: string; note: string }> = {
  added: { name: "เพิ่มเติม", note: "ส่วนที่เพิ่มจากเอกสารคอร์ส Creatr365" },
  brand: { name: "Creatr365", note: "เกณฑ์หรือโมเดลของ Creatr365 เอง ไม่ใช่ตัวเลขของแพลตฟอร์ม" },
  practice: { name: "แนวปฏิบัติ", note: "ค่าที่ใช้กันในวงการ ไม่ใช่สถิติ" },
  unverified: { name: "ยังไม่ยืนยันแหล่ง", note: "ยังหาหน้าต้นทางไม่เจอ อย่าใช้เป็นตัวเลขหลักในงานเผยแพร่" },
};

export function toneFor(label: string): LabelTone | null {
  if (label.startsWith("ยังไม่ยืนยัน")) return "unverified";
  if (label.startsWith("แนวปฏิบัติ")) return "practice";
  if (label.startsWith("เพิ่มเติม")) return "added";
  if (label.startsWith("Creatr365") || label.startsWith("ข้อสรุปของ Creatr365")) return "brand";
  return null;
}

/**
 * Splits a source cell into text / bold / link / label tokens.
 * Escaped brackets (\[ \]) are never treated as link syntax.
 */
export function tokenizeInline(source: string): InlineToken[] {
  const raw: InlineToken[] = [];
  let buffer = "";
  let bold = false;

  const flush = () => {
    if (buffer) raw.push({ kind: "text", text: buffer, bold });
    buffer = "";
  };

  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === "\\" && i + 1 < source.length) {
      // keep escaped brackets distinguishable for the label pass
      const next = source[i + 1];
      buffer += next === "[" ? "\u0001" : next === "]" ? "\u0002" : next;
      i += 2;
      continue;
    }
    if (char === "*" && source[i + 1] === "*") {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (char === "[") {
      const link = readLink(source, i);
      if (link) {
        flush();
        raw.push({ kind: "link", text: unescapeMd(link.text), href: link.href, bold });
        i = link.end;
        continue;
      }
    }
    buffer += char;
    i += 1;
  }
  flush();

  return raw.flatMap((token) => (token.kind === "text" ? splitLabels(token.text, token.bold) : [token]));
}

function readLink(source: string, start: number) {
  let depth = 0;
  for (let j = start; j < source.length; j += 1) {
    const c = source[j];
    if (c === "\\") {
      j += 1;
      continue;
    }
    if (c === "[") depth += 1;
    if (c === "]") {
      depth -= 1;
      if (depth === 0) {
        if (source[j + 1] !== "(") return null;
        const close = source.indexOf(")", j + 2);
        if (close < 0) return null;
        const href = source.slice(j + 2, close);
        if (!/^https?:\/\//.test(href)) return null;
        return { text: source.slice(start + 1, j), href, end: close + 1 };
      }
    }
  }
  return null;
}

/** Turns \u0001label\u0002 runs (escaped brackets) into label tokens, innermost first. */
function splitLabels(text: string, bold?: boolean): InlineToken[] {
  const out: InlineToken[] = [];
  const pattern = /\u0001([^\u0001\u0002]*)\u0002/;
  let rest = text;
  // Flatten nested brackets: "[แนวปฏิบัติ [ยังไม่ยืนยันแหล่ง]]" -> two labels.
  const inner: string[] = [];
  while (pattern.test(rest)) {
    rest = rest.replace(pattern, (_, body: string) => {
      inner.push(body);
      return `\u0003${inner.length - 1}\u0004`;
    });
  }
  const parts = rest.split(/(\u0003\d+\u0004)/);
  for (const part of parts) {
    const ref = /^\u0003(\d+)\u0004$/.exec(part);
    if (!ref) {
      if (part) out.push({ kind: "text", text: part.replace(/[\u0001]/g, "[").replace(/[\u0002]/g, "]"), bold });
      continue;
    }
    out.push(...expandLabel(inner, Number(ref[1]), bold));
  }
  return out;
}

function expandLabel(inner: string[], index: number, bold?: boolean): InlineToken[] {
  const body = inner[index];
  const nested = body.split(/(\u0003\d+\u0004)/);
  const head = nested[0];
  const tone = toneFor(head.trim());
  const tail: InlineToken[] = [];
  for (const piece of nested.slice(1)) {
    const ref = /^\u0003(\d+)\u0004$/.exec(piece);
    if (ref) tail.push(...expandLabel(inner, Number(ref[1]), bold));
    else if (piece.trim()) tail.push({ kind: "text", text: piece, bold });
  }
  if (!tone) {
    return [{ kind: "text", text: `[${head}`, bold }, ...tail, { kind: "text", text: "]", bold }];
  }
  const name = LABEL_INFO[tone].name;
  const trimmed = head.trim();
  if (!trimmed.startsWith(name)) return [{ kind: "label", text: trimmed, rest: "", tone }, ...tail];
  const restText = trimmed.slice(name.length).replace(/^\s*[—-]?\s*/, (m) => (m.trim() ? " — " : ""));
  return [{ kind: "label", text: name, rest: restText, tone }, ...tail];
}

/** Splits a markdown table row on unescaped pipes. */
export function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.trim());
}

/** Splits on `separator` only outside brackets/parentheses, so labels and links stay whole. */
export function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "\\" && (value[i + 1] === "[" || value[i + 1] === "]")) {
      depth += value[i + 1] === "[" ? 1 : -1;
      i += 1;
      continue;
    }
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && value.startsWith(separator, i)) {
      parts.push(value.slice(start, i));
      start = i + separator.length;
      i += separator.length - 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

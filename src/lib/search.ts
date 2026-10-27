import type { Entry } from "../data/types";
import { englishLayoutToThai, hasLatin, hasThai, thaiLayoutToEnglish } from "./keyboard";
import { stripMd } from "./markdown";

/* ---------- normalisation ---------- */

export function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}

export const compact = (value: string) => normalize(value).replace(/\s+/g, "");

/** Drops Thai tone marks / thanthakhat so "เดดแอ" still meets "เด็ดแอร์". */
export const loose = (value: string) => compact(value).replace(/[\u0E47-\u0E4E]/g, "");

/* ---------- index ---------- */

type KeyKind = "variant" | "alias" | "pron" | "full";

type SearchKey = {
  norm: string;
  compact: string;
  loose: string;
  words: string[];
  kind: KeyKind;
  weight: number;
  variantIndex?: number;
};

type Indexed = { entry: Entry; keys: SearchKey[]; body: string; bodyLoose: string };

const WEIGHT: Record<KeyKind, number> = { variant: 1, alias: 0.93, pron: 0.92, full: 0.82 };

function makeKey(text: string, kind: KeyKind, variantIndex?: number): SearchKey | null {
  const norm = normalize(text);
  if (!norm) return null;
  return { norm, compact: norm.replace(/\s+/g, ""), loose: loose(text), words: norm.split(" "), kind, weight: WEIGHT[kind], variantIndex };
}

function buildIndex(entries: Entry[]): Indexed[] {
  return entries.map((entry) => {
    const keys: SearchKey[] = [];
    const add = (text: string, kind: KeyKind, variantIndex?: number) => {
      const key = makeKey(text, kind, variantIndex);
      if (key && !keys.some((item) => item.compact === key.compact && item.kind === kind)) keys.push(key);
    };
    add(entry.term, "variant", 0);
    entry.variants.forEach((variant, index) => {
      add(variant.text, "variant", index);
      if (variant.pron) add(variant.pron, "pron", index);
    });
    add(entry.pronunciation.replace(/\([^)]*\)/g, " "), "pron", 0);
    entry.pronAlts.forEach((alt) => add(alt, "pron", 0));
    if (entry.fullName) {
      add(entry.fullName, "full");
      add(entry.fullName.replace(/\([^)]*\)/g, " "), "full");
      for (const inner of entry.fullName.matchAll(/\(([^)]*)\)/g)) add(inner[1], "full");
    }
    entry.aliases.forEach((alias) => add(alias, "alias"));
    const bodyText = [entry.summary, ...entry.fields.map((field) => stripMd(field.value))].join(" ");
    return { entry, keys, body: normalize(bodyText), bodyLoose: loose(bodyText) };
  });
}

/* ---------- distance ---------- */

/** Optimal-string-alignment distance (Damerau-Levenshtein with adjacent swaps). */
export function editDistance(a: string, b: string, limit = Infinity) {
  const s = Array.from(a);
  const t = Array.from(b);
  if (Math.abs(s.length - t.length) > limit) return limit + 1;
  const rows: number[][] = [];
  for (let i = 0; i <= s.length; i += 1) rows.push([i, ...new Array(t.length).fill(0)]);
  for (let j = 0; j <= t.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= s.length; i += 1) {
    let rowMin = Infinity;
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      rows[i][j] = value;
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > limit) return limit + 1;
  }
  return rows[s.length][t.length];
}

const allowedEdits = (length: number) => (length <= 2 ? 0 : length <= 4 ? 1 : length <= 7 ? 2 : 3);

function bigrams(value: string) {
  const chars = Array.from(value);
  const grams = new Set<string>();
  for (let i = 0; i < chars.length - 1; i += 1) grams.add(chars[i] + chars[i + 1]);
  if (chars.length === 1) grams.add(chars[0]);
  return grams;
}

/** Dice similarity on character bigrams, 0..1 */
export function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const x = bigrams(a);
  const y = bigrams(b);
  let shared = 0;
  x.forEach((gram) => y.has(gram) && (shared += 1));
  return (2 * shared) / (x.size + y.size);
}

/* ---------- scoring ---------- */

export type MatchType = "exact" | "prefix" | "contains" | "typo" | "meaning" | "nearby";

export type Hit = {
  entry: Entry;
  score: number;
  type: MatchType;
  /** Which variant the query pointed at — drives highlight and speech. */
  variantIndex: number;
};

type Query = { norm: string; compact: string; loose: string; words: string[] };

function makeQuery(text: string): Query {
  const norm = normalize(text);
  return { norm, compact: norm.replace(/\s+/g, ""), loose: loose(text), words: norm.split(" ").filter(Boolean) };
}

function scoreKey(query: Query, key: SearchKey): { score: number; type: MatchType } | null {
  const q = query.compact;
  if (!q) return null;
  if (key.compact === q) return { score: 100, type: "exact" };
  if (key.loose && key.loose === query.loose) return { score: 95, type: "exact" };
  if (key.compact.startsWith(q)) {
    if (q.length === 1 && key.kind !== "variant") return null;
    return { score: 90 - Math.min(12, (key.compact.length - q.length) * 0.6), type: "prefix" };
  }
  const length = Array.from(q).length;
  if (length >= 2 && query.words.length) {
    if (query.words.every((word) => key.words.includes(word))) return { score: 84, type: "prefix" };
    if (query.words.every((word) => key.words.some((candidate) => candidate.startsWith(word)))) return { score: 78, type: "prefix" };
  }
  // Short Latin queries ("ctr") inside longer words ("electronic") are noise, so skip mid-word hits.
  const midWordOk = length >= 4 || hasThai(q);
  if (midWordOk && length >= 2 && key.compact.includes(q)) return { score: 70, type: "contains" };
  if (midWordOk && Array.from(query.loose).length >= 2 && key.loose.includes(query.loose)) return { score: 66, type: "contains" };

  const limit = allowedEdits(length);
  if (limit > 0) {
    const whole = editDistance(q, key.compact, limit);
    if (whole <= limit) return { score: 62 - whole * 7, type: "typo" };
    if (length >= 4) {
      const prefix = editDistance(q, Array.from(key.compact).slice(0, length).join(""), limit);
      if (prefix <= limit) return { score: 54 - prefix * 7, type: "typo" };
    }
    for (const word of key.words) {
      if (word.length < 3) continue;
      const distance = editDistance(q, word, limit);
      if (distance <= limit) return { score: 56 - distance * 7, type: "typo" };
    }
  }
  return null;
}

function scoreEntry(item: Indexed, query: Query): Hit | null {
  let best: Hit | null = null;
  for (const key of item.keys) {
    const result = scoreKey(query, key);
    if (!result) continue;
    const score = result.score * key.weight;
    if (!best || score > best.score) best = { entry: item.entry, score, type: result.type, variantIndex: key.variantIndex ?? 0 };
  }
  if (!best && query.compact.length >= 2) {
    const words = query.words.filter((word) => Array.from(word).length >= 2);
    if (words.length) {
      const found = words.filter((word) => item.body.includes(word) || item.bodyLoose.includes(loose(word))).length;
      if (found === words.length) best = { entry: item.entry, score: 34, type: "meaning", variantIndex: 0 };
      else if (found > 0 && words.length > 1) best = { entry: item.entry, score: 18 * (found / words.length), type: "meaning", variantIndex: 0 };
    }
  }
  if (best && item.entry.mustKnow) best.score += 0.5;
  return best;
}

/* ---------- public API ---------- */

export type SearchResult = {
  query: string;
  /** Set when the query was re-read through the other keyboard layout. */
  layoutFix?: string;
  /** Strong matches, best first. */
  best: Hit[];
  /** Other terms from the same group as the best match, closest to the query first. */
  sameGroup: Hit[];
  /** Terms that only mention the query in their explanation. */
  mentions: Hit[];
  /** True when nothing matched directly and `best` holds the nearest spellings instead. */
  nearbyOnly: boolean;
};

export function createSearch(entries: Entry[]) {
  const index = buildIndex(entries);

  const run = (text: string) =>
    index
      .map((item) => scoreEntry(item, makeQuery(text)))
      .filter((hit): hit is Hit => Boolean(hit))
      .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);

  /** Closest spellings by similarity — used so a search never comes back empty. */
  const nearby = (text: string, count: number): Hit[] => {
    const q = compact(text);
    const ql = loose(text);
    return index
      .map((item) => {
        let best = 0;
        let variantIndex = 0;
        for (const key of item.keys) {
          const value = Math.max(similarity(q, key.compact), similarity(ql, key.loose) * 0.95);
          if (value > best) {
            best = value;
            variantIndex = key.variantIndex ?? 0;
          }
        }
        if (!best) {
          // No shared letter pairs: fall back to shared letters, then to must-know terms.
          const letters = new Set(Array.from(q));
          const term = compact(item.entry.variants[0]?.text ?? "");
          best = (Array.from(term).filter((char) => letters.has(char)).length / Math.max(1, term.length)) * 0.2;
          if (!best && item.entry.mustKnow) best = 0.01;
        }
        return { entry: item.entry, score: best * 30, type: "nearby" as const, variantIndex };
      })
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.entry.mustKnow) - Number(a.entry.mustKnow) || a.entry.order - b.entry.order)
      .slice(0, count);
  };

  const closeness = (entry: Entry, text: string) => {
    const q = compact(text);
    return Math.max(...entry.variants.map((variant) => similarity(q, compact(variant.text))), similarity(q, compact(entry.fullName)) * 0.8);
  };

  function search(text: string): SearchResult {
    const query = text.trim();
    const empty: SearchResult = { query, best: [], sameGroup: [], mentions: [], nearbyOnly: false };
    if (!normalize(query)) return empty;

    let hits = run(query);
    let layoutFix: string | undefined;
    const top = hits[0]?.score ?? 0;
    const swapped = hasThai(query) && !hasLatin(query) ? thaiLayoutToEnglish(query) : hasLatin(query) && !hasThai(query) ? englishLayoutToThai(query) : "";
    if (swapped && normalize(swapped) && top < 75) {
      const alt = run(swapped);
      const altTop = alt[0] ? alt[0].score * 0.97 : 0;
      // Only trust the other layout when it lands on a real word, not a fuzzy guess.
      if (altTop >= 75 && altTop > top) {
        hits = alt;
        layoutFix = swapped;
      }
    }

    const direct = hits.filter((hit) => hit.type !== "meaning");
    let best: Hit[];
    let nearbyOnly = false;
    if (direct.length) {
      const cut = Math.max(40, direct[0].score * 0.6);
      best = direct.filter((hit) => hit.score >= cut).slice(0, 10);
    } else if (hits.length) {
      best = hits.slice(0, 6);
    } else {
      best = nearby(layoutFix ?? query, 6);
      nearbyOnly = true;
    }

    const used = new Set(best.map((hit) => hit.entry.id));
    const anchor = best[0]?.entry;
    const effective = layoutFix ?? query;
    const scored = new Map(hits.map((hit) => [hit.entry.id, hit]));
    const sameGroup: Hit[] = anchor
      ? entries
          .filter((entry) => entry.categoryId === anchor.categoryId && !used.has(entry.id))
          .map((entry) => scored.get(entry.id) ?? { entry, score: 0, type: "nearby" as const, variantIndex: 0 })
          .sort((a, b) => b.score - a.score || closeness(b.entry, effective) - closeness(a.entry, effective) || a.entry.order - b.entry.order)
          .slice(0, 12)
      : [];
    sameGroup.forEach((hit) => used.add(hit.entry.id));
    const mentions = hits.filter((hit) => !used.has(hit.entry.id)).slice(0, 8);

    return { query, layoutFix, best, sameGroup, mentions, nearbyOnly };
  }

  return { search };
}

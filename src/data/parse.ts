import { splitRow, stripMd } from "../lib/markdown";
import type { AppendixSection, Category, Entry, Field, Glossary, Variant } from "./types";

/** English short names for categories that the source titles only in Thai. */
const CATEGORY_EN: Record<number, string> = {
  4: "Platform & Live Ops",
  6: "Finance & Business",
  7: "Compliance",
  8: "Creator Ecosystem",
  9: "Brand Deals & Contracts",
  10: "Production & Ads",
  11: "Course & Content Planner",
  12: "Appendix",
};

const DETAIL_MARKERS: Record<string, string> = {
  "เกณฑ์/ตัวเลข": "เกณฑ์ / ตัวเลข",
  "เทคนิค": "เทคนิค",
  "ดูได้ที่/ใช้กับ": "ดูได้ที่ / ใช้กับ",
};

/** Appendix sub-sections kept as readable documents on the "ข้อมูลเพิ่มเติม" page. */
const APPENDIX_IDS = new Set(["11.3", "12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "sources"]);

type Table = { header: string[]; rows: string[][] };

export function compactKey(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, "");
}

export function parseGlossary(markdown: string): Glossary {
  orderCounter = 0;
  const lines = markdown.split(/\r?\n/);
  const categories: Category[] = [];
  const entries: Entry[] = [];
  const appendixLines = new Map<string, { title: string; lines: string[] }>();
  const legendLine = lines.find((line) => line.startsWith("**หมายเหตุการอ่าน:**")) ?? "";
  const docTitle = stripMd(lines.find((line) => line.includes("Master Glossary")) ?? "Glossary");

  let category: Category | null = null;
  let sectionId = "";
  let sectionTitle = "";
  let afterHeading = false;
  let pendingTable: string[] = [];
  const glossary18: { cells: string[] }[] = [];
  const kpiRows: Table = { header: [], rows: [] };
  let npsLine = "";

  const flushTable = () => {
    if (pendingTable.length < 2) {
      pendingTable = [];
      return;
    }
    const header = splitRow(pendingTable[0]).map(stripMd);
    const rows = pendingTable.slice(2).map(splitRow);
    pendingTable = [];
    handleTable({ header, rows });
  };

  const handleTable = (table: Table) => {
    if (!category) return;
    const num = category.num;
    if (num <= 10) {
      table.rows.forEach((cells) => entries.push(fromStandardRow(cells, category!, sectionLabel())));
    } else if (sectionId === "11.1") {
      table.rows.forEach((cells) => entries.push(fromCourseRow(cells, category!, sectionLabel())));
    } else if (sectionId === "11.2") {
      table.rows.forEach((cells) => glossary18.push({ cells }));
    } else if (sectionId === "11.4") {
      table.rows.forEach((cells) => entries.push(fromLoanwordRow(cells, category!, sectionLabel())));
    } else if (sectionId === "12.1") {
      table.rows.forEach((cells) => entries.push(fromGenericRow(cells, table.header, category!, sectionLabel(), { thaiParenAsFullName: true, summaryIndex: 1 })));
    } else if (sectionId === "12.2") {
      table.rows.forEach((cells) => entries.push(fromGenericRow(cells, table.header, category!, sectionLabel(), { summaryIndex: 4 })));
    } else if (sectionId === "12.3") {
      kpiRows.header = table.header;
      kpiRows.rows = table.rows;
    }
  };

  const sectionLabel = () => {
    const base = `หมวด ${category?.num} · ${category?.title}`;
    return sectionId ? `${base} · ${sectionId} ${sectionTitle}` : base;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      pendingTable.push(trimmed);
      afterHeading = false;
      if (appendixLines.has(sectionId)) appendixLines.get(sectionId)!.lines.push(line);
      continue;
    }
    if (pendingTable.length) flushTable();

    const h1 = /^#\s+\*\*(.+?)\*\*\s*$/.exec(trimmed);
    if (h1 && !trimmed.startsWith("##")) {
      const title = stripMd(h1[1]);
      const numbered = /^(\d+)\.\s*(.+)$/.exec(title);
      sectionId = "";
      sectionTitle = "";
      if (numbered) {
        const num = Number(numbered[1]);
        const paren = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(numbered[2]);
        const thai = paren && /[A-Za-z]/.test(paren[2]) && !/[ก-๙]/.test(paren[2]) ? paren[1] : numbered[2];
        const en = paren && thai === paren[1] ? paren[2].replace(/^The\s+/, "") : CATEGORY_EN[num] ?? "";
        category = { id: String(num), num, title: thai, en };
        categories.push(category);
        afterHeading = true;
      } else if (title.startsWith("แหล่งที่มา")) {
        category = null;
        sectionId = "sources";
        sectionTitle = title;
        appendixLines.set("sources", { title, lines: [] });
      } else {
        category = null;
      }
      continue;
    }

    const h2 = /^##\s+\*\*(.+?)\*\*\s*$/.exec(trimmed);
    if (h2) {
      const title = stripMd(h2[1]);
      const match = /^(\d+\.\d+)\s+(.+)$/.exec(title);
      sectionId = match ? match[1] : title;
      sectionTitle = match ? match[2] : title;
      if (APPENDIX_IDS.has(sectionId)) appendixLines.set(sectionId, { title: sectionTitle, lines: [] });
      afterHeading = false;
      continue;
    }

    if (appendixLines.has(sectionId)) appendixLines.get(sectionId)!.lines.push(line);
    if (sectionId === "12.3" && trimmed.startsWith("NPS")) npsLine = trimmed;
    if (afterHeading && trimmed && category && !category.intro) {
      category.intro = trimmed;
      afterHeading = false;
    }
  }
  if (pendingTable.length) flushTable();

  if (npsLine) {
    const cat = categories.find((item) => item.num === 12)!;
    entries.push(fromNpsLine(npsLine, cat));
  }

  const merged = mergeDuplicates(entries);
  applyGlossary18(merged, glossary18);
  applyKpiTargets(merged, kpiRows);
  assignIds(merged);

  const appendix: AppendixSection[] = Array.from(appendixLines.entries()).map(([id, value]) => ({
    id,
    title: value.title,
    markdown: value.lines.join("\n").trim(),
  }));

  return { entries: merged, categories, appendix, legend: legendLine, docTitle };
}

/* ---------- row builders ---------- */

type TermParts = { term: string; pron: string; labels: string[]; repeated: boolean };

function parseTermCell(cell: string): TermParts {
  const [left, right = ""] = cell.split("**อ่านว่า:**");
  let term = stripMd(left);
  const labels: string[] = [];
  term = term.replace(/\[(เพิ่มเติม|Creatr365)\]/g, (_, label: string) => {
    labels.push(label);
    return "";
  });
  const repeated = /\(ย้ำ\)/.test(term);
  term = term.replace(/\(ย้ำ\)/g, "").replace(/\s+/g, " ").trim();
  return { term, pron: stripMd(right), labels, repeated };
}

function buildVariants(term: string, pron: string) {
  const parenOf = (value: string) => [...value.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  const outside = (value: string) => value.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

  const pronMain = outside(pron);
  const pronAlts = parenOf(pron).flatMap((part) => part.split(/\s*\/\s*/)).filter(Boolean);
  const pronParts = pronMain.split(/\s+\/\s+/).filter(Boolean);
  const termMain = outside(term);
  const termParts = termMain.split(/\s*\/\s*/).filter(Boolean);
  const termParen = parenOf(term);

  const variants: Variant[] = [];
  const push = (text: string, variantPron?: string) => {
    const clean = text.trim();
    if (!clean) return;
    const existing = variants.find((item) => compactKey(item.text) === compactKey(clean));
    if (existing) {
      if (!existing.pron && variantPron) existing.pron = variantPron;
      return;
    }
    variants.push({ text: clean, pron: variantPron || undefined });
  };

  // Pair readings with terms in order ("CR / CVR" + "ซี-อาร์ / ซี-วี-อาร์").
  termParts.forEach((part, index) => push(part, pronParts[index]));
  const pronParen = parenOf(pron);
  termParen.forEach((paren, index) => {
    const pieces = paren.split(/\s*\/\s*/).filter(Boolean);
    const paired = termParen.length === pronParen.length && pieces.length === 1 && /[ก-๙]/.test(pronParen[index] ?? "") ? pronParen[index] : undefined;
    pieces.forEach((piece) => push(piece, paired));
  });

  return { variants, pronMain, pronAlts };
}

function makeEntry(partial: Partial<Entry> & Pick<Entry, "term" | "categoryId" | "section">): Entry {
  const built = buildVariants(partial.term, partial.pronunciation ?? "");
  return {
    id: "",
    variants: built.variants,
    pronunciation: built.pronMain,
    pronAlts: built.pronAlts,
    fullName: "",
    summary: "",
    labels: [],
    fields: [],
    extraBlocks: [],
    mustKnow: false,
    aliases: [],
    order: orderCounter++,
    ...partial,
  };
}

let orderCounter = 0;

function splitDetails(cell: string, categoryNum: number): Field[] {
  const text = cell.trim();
  if (!text || text === "—") return [];
  const pattern = /\*\*(เกณฑ์\/ตัวเลข|เทคนิค|ดูได้ที่\/ใช้กับ):\*\*/g;
  const fields: Field[] = [];
  let last = 0;
  let label = "หมายเหตุ";
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    const before = text.slice(last, match.index).trim();
    if (before) fields.push({ label, value: before });
    label = DETAIL_MARKERS[match[1]];
    if (categoryNum === 8 && match[1] === "เกณฑ์/ตัวเลข") label = "ตัวอย่าง / หมายเหตุ";
    last = match.index + match[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail) fields.push({ label, value: tail });
  return fields;
}

function fromStandardRow(cells: string[], category: Category, section: string): Entry {
  const [termCell, fullCell = "", meaningCell = "", detailCell = ""] = cells;
  const parts = parseTermCell(termCell);
  return Object.assign(
    makeEntry({
      term: parts.term,
      pronunciation: parts.pron,
      labels: parts.labels,
      fullName: stripMd(fullCell),
      summary: stripMd(meaningCell),
      categoryId: category.id,
      section,
      fields: [{ label: "ความหมาย", value: meaningCell }, ...splitDetails(detailCell, category.num)],
    }),
    { repeated: parts.repeated },
  );
}

function fromCourseRow(cells: string[], category: Category, section: string): Entry {
  const [termCell, meaningCell = "", noteCell = ""] = cells;
  const parts = parseTermCell(termCell);
  const plain = stripMd(meaningCell);
  const dash = plain.indexOf(" — ");
  const fullName = dash > 0 ? plain.slice(0, dash) : "";
  const meaning = dash > 0 ? plain.slice(dash + 3) : plain;
  const fields: Field[] = [{ label: "ความหมาย", value: meaningCell }];
  if (noteCell.trim()) fields.push({ label: "หมายเหตุ", value: noteCell });
  return makeEntry({ term: parts.term, pronunciation: parts.pron, labels: parts.labels, fullName, summary: meaning, categoryId: category.id, section, fields });
}

function fromLoanwordRow(cells: string[], category: Category, section: string): Entry {
  const [termCell, pronCell = "", meaningCell = ""] = cells;
  return makeEntry({
    term: stripMd(termCell),
    pronunciation: stripMd(pronCell),
    summary: stripMd(meaningCell),
    categoryId: category.id,
    section,
    fields: [{ label: "คำแปล / ความหมาย", value: meaningCell }],
  });
}

function fromGenericRow(
  cells: string[],
  header: string[],
  category: Category,
  section: string,
  options: { thaiParenAsFullName?: boolean; summaryIndex: number },
): Entry {
  const parts = parseTermCell(cells[0]);
  let term = parts.term;
  let fullName = "";
  if (options.thaiParenAsFullName) {
    const paren = /^(.*?)\s*\(([^)]*[ก-๙][^)]*)\)\s*$/.exec(term);
    if (paren) {
      term = paren[1];
      fullName = paren[2];
    }
  }
  const fields = cells.slice(1).map((value, index) => ({ label: header[index + 1] ?? `ข้อมูล ${index + 1}`, value }));
  return makeEntry({
    term,
    pronunciation: parts.pron,
    labels: parts.labels,
    fullName,
    summary: stripMd(cells[options.summaryIndex] ?? cells[1] ?? ""),
    categoryId: category.id,
    section,
    fields,
  });
}

function fromNpsLine(line: string, category: Category): Entry {
  // "NPS \= Net Promoter Score (เน็ต โปร-โม-เตอร์ สกอร์) — คะแนน... \[เพิ่มเติม: ...\]"
  const plain = stripMd(line);
  const match = /^NPS\s*=\s*([^()]+?)\s*\(([^)]+)\)\s*—\s*(.+)$/.exec(plain);
  const meaningRaw = line.split(" — ").slice(1).join(" — ");
  return makeEntry({
    term: "NPS",
    pronunciation: match?.[2] ?? "",
    fullName: match?.[1] ?? "Net Promoter Score",
    summary: (match?.[3] ?? plain).replace(/\s*\[เพิ่มเติม:[^\]]*\]\s*$/, ""),
    labels: ["เพิ่มเติม"],
    categoryId: category.id,
    section: `หมวด ${category.num} · ${category.title} · 12.3 เป้า KPI มาตรฐาน Creatr365`,
    fields: [{ label: "ความหมาย", value: meaningRaw || line }],
  });
}

/* ---------- post-processing ---------- */

function mergeDuplicates(entries: (Entry & { repeated?: boolean })[]): Entry[] {
  const result: Entry[] = [];
  for (const entry of entries) {
    const keys = entry.variants.map((variant) => compactKey(variant.text));
    const target = result.find((candidate) => {
      const candidateKeys = candidate.variants.map((variant) => compactKey(variant.text));
      const sameSet = keys.length === candidateKeys.length && keys.every((key) => candidateKeys.includes(key));
      if (sameSet) return true;
      if (!entry.repeated) return false;
      return keys.some((key) => candidateKeys.some((other) => other === key || other.startsWith(key)));
    });
    if (!target) {
      delete entry.repeated;
      result.push(entry);
      continue;
    }
    // A "(ย้ำ)" row or a course-shorthand repeat only points back at the main row,
    // so only a genuinely different explanation from another category is kept.
    const meaning = entry.fields.find((field) => field.label === "ความหมาย");
    if (!entry.repeated && entry.categoryId !== "11" && meaning) {
      const categoryTitle = entry.section.split(" · ")[1] ?? "";
      target.extraBlocks.push({ source: `ในบริบท${categoryTitle}`, fields: [meaning] });
    }
    entry.variants.forEach((variant) => {
      if (!target.variants.some((item) => compactKey(item.text) === compactKey(variant.text))) target.variants.push(variant);
    });
    entry.labels.forEach((label) => !target.labels.includes(label) && target.labels.push(label));
  }
  return result;
}

function findEntry(entries: Entry[], name: string, categoryNum?: number) {
  const wanted = [compactKey(name), compactKey(name.replace(/\s+Framework$/i, ""))];
  const pool = categoryNum ? entries.filter((entry) => entry.categoryId === String(categoryNum)) : entries;
  return (
    pool.find((entry) => entry.variants.some((variant) => wanted.includes(compactKey(variant.text)))) ??
    pool.find((entry) => wanted.includes(compactKey(entry.fullName.replace(/\([^)]*\)/g, "")))) ??
    pool.find((entry) => entry.variants.some((variant) => wanted.some((key) => compactKey(variant.text).startsWith(key))))
  );
}

function applyGlossary18(entries: Entry[], rows: { cells: string[] }[]) {
  for (const { cells } of rows) {
    const parts = parseTermCell(cells[0]);
    const categoryNum = Number(stripMd(cells[2] ?? "")) || undefined;
    const target = findEntry(entries, parts.term, categoryNum);
    if (!target) throw new Error(`Glossary 18: no entry for ${parts.term}`);
    target.mustKnow = true;
    const key = compactKey(parts.term);
    const variant = target.variants.find((item) => compactKey(item.text) === key);
    if (variant) {
      if (!variant.pron && parts.pron) variant.pron = parts.pron;
    } else {
      target.variants.push({ text: parts.term, pron: parts.pron || undefined });
    }
  }
}

const KPI_TARGETS: Record<string, string> = {
  "Conversion Rate (CR)": "CR",
  "Return Rate": "Return Rate",
  "Watch Time เฉลี่ย": "Watch Time",
  "Dead Air": "Dead Air",
  "NPS Score (คอร์ส)": "NPS",
};

function applyKpiTargets(entries: Entry[], table: Table) {
  if (!table.rows.length) return;
  for (const cells of table.rows) {
    const name = stripMd(cells[0]);
    const term = KPI_TARGETS[name];
    if (!term) continue;
    const target = findEntry(entries, term);
    if (!target) continue;
    const value = cells
      .slice(1)
      .map((cell, index) => `${table.header[index + 1]}: ${cell}`)
      .join(" · ");
    target.fields.push({ label: "เป้า KPI มาตรฐาน Creatr365", value });
  }
}

function assignIds(entries: Entry[]) {
  const used = new Set<string>();
  for (const entry of entries) {
    const base =
      entry.variants[0]?.text
        .toLowerCase()
        .replace(/&/g, "-and-")
        .replace(/[^a-z0-9ก-๙]+/g, "-")
        .replace(/^-+|-+$/g, "") || "term";
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    entry.id = id;
  }
}

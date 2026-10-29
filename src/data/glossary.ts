import raw from "../../content/glossary.md?raw";
import { splitTopLevel } from "../lib/markdown";
import { ALIASES, VERIFY_NOTES } from "./aliases";
import { parseGlossary } from "./parse";
import type { Entry } from "./types";

/** Parsed once at startup from content/glossary.md — edit that file to update the app. */
export const glossary = parseGlossary(raw);

/**
 * Pointers into the source document ("ที่มา: Module 6", "ดูหมวด 12 ข้อ 12.1")
 * mean nothing to readers of the app, so they are dropped from the cells.
 */
const DOC_REFERENCE = /^(ที่มา:|ดูหมวด|ดูรายการ|ดูรายละเอียด|รายละเอียดดู|ดู [A-Za-z]+ หมวด)/;

function dropDocReferences(value: string) {
  return splitTopLevel(value, " · ")
    .map((part) => part.trim())
    .filter((part) => part && !DOC_REFERENCE.test(part))
    .join(" · ");
}

for (const entry of glossary.entries) {
  entry.fields = entry.fields
    .map((field) => ({ ...field, value: field.label === "ความหมาย" ? field.value : dropDocReferences(field.value) }))
    .filter((field) => field.value.trim() && field.value.trim() !== "—");
  entry.aliases = ALIASES[entry.id] ?? [];
  const note = VERIFY_NOTES[entry.id];
  if (note) entry.fields.push({ label: "หมายเหตุ", value: note });
}

export const entries = glossary.entries;
export const categories = glossary.categories;

const byId = new Map(entries.map((entry) => [entry.id, entry]));
export const getEntry = (id: string): Entry | undefined => byId.get(id);
export const getCategory = (id: string) => categories.find((category) => category.id === id);
export const entriesInCategory = (id: string) => entries.filter((entry) => entry.categoryId === id);
export const mustKnow = entries.filter((entry) => entry.mustKnow);

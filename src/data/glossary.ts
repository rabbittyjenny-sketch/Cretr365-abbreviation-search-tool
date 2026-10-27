import raw from "../../content/glossary.md?raw";
import { ALIASES, VERIFY_NOTES } from "./aliases";
import { parseGlossary } from "./parse";
import type { Entry } from "./types";

/** Parsed once at startup from content/glossary.md — edit that file to update the app. */
export const glossary = parseGlossary(raw);

for (const entry of glossary.entries) {
  entry.aliases = ALIASES[entry.id] ?? [];
  const note = VERIFY_NOTES[entry.id];
  if (note) entry.fields.push({ label: "หมายเหตุตรวจคำ", value: note });
}

export const entries = glossary.entries;
export const categories = glossary.categories;

const byId = new Map(entries.map((entry) => [entry.id, entry]));
export const getEntry = (id: string): Entry | undefined => byId.get(id);
export const getCategory = (id: string) => categories.find((category) => category.id === id);
export const entriesInCategory = (id: string) => entries.filter((entry) => entry.categoryId === id);
export const mustKnow = entries.filter((entry) => entry.mustKnow);

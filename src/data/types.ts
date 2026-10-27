export type Variant = {
  /** The spoken/searchable form of one variant, e.g. "CVR" out of "CR / CVR". */
  text: string;
  /** Thai reading guide for this variant, when the source gives one. */
  pron?: string;
};

export type Field = {
  label: string;
  /** Markdown-ish cell text exactly as in the source (escapes intact). */
  value: string;
};

export type Block = {
  /** Where this block comes from, e.g. "หมวด 8 · ระบบนิเวศครีเอเตอร์" */
  source: string;
  fields: Field[];
};

export type Category = {
  id: string;
  num: number;
  title: string;
  en: string;
  intro?: string;
};

export type Entry = {
  id: string;
  term: string;
  variants: Variant[];
  /** Reading guide exactly as shown in the source, e.g. "ซี-ทอร์ (ซี-ที-โอ-อาร์)". */
  pronunciation: string;
  /** Extra readings found in parentheses, e.g. "ซี-ที-โอ-อาร์". */
  pronAlts: string[];
  fullName: string;
  /** Short plain-text meaning used in result rows. */
  summary: string;
  labels: string[];
  categoryId: string;
  section: string;
  fields: Field[];
  /** Same term repeated elsewhere in the source, merged here. */
  extraBlocks: Block[];
  /** Part of the "Glossary 18 คำ (คำที่ต้องรู้)" list. */
  mustKnow: boolean;
  aliases: string[];
  order: number;
};

export type Glossary = {
  entries: Entry[];
  categories: Category[];
  appendix: AppendixSection[];
  legend: string;
  docTitle: string;
};

export type AppendixSection = {
  id: string;
  title: string;
  /** Raw markdown lines of the section (tables, paragraphs). */
  markdown: string;
};

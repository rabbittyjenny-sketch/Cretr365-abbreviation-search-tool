import { describe, expect, it } from "vitest";
import { entries, mustKnow } from "../data/glossary";
import { createSearch, editDistance } from "./search";
import { thaiLayoutToEnglish } from "./keyboard";

const { search } = createSearch(entries);
const top = (query: string) => search(query).best[0]?.entry.id;

describe("glossary data", () => {
  it("parses every table row into an entry", () => {
    expect(entries.length).toBeGreaterThanOrEqual(120);
    for (const entry of entries) {
      expect(entry.term.trim()).not.toBe("");
      expect(entry.categoryId).toMatch(/^\d+$/);
      expect(entry.fields.length).toBeGreaterThan(0);
    }
  });

  it("marks all 18 must-know terms", () => {
    expect(mustKnow).toHaveLength(18);
  });

  it("keeps ids unique", () => {
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });

  it("merges repeated rows instead of duplicating them", () => {
    const kol = entries.filter((entry) => entry.variants.some((variant) => variant.text === "KOL"));
    expect(kol).toHaveLength(1);
    expect(kol[0].extraBlocks.length).toBeGreaterThan(0);
  });
});

describe("search ranking", () => {
  it.each([
    ["gmv", "gmv"],
    ["GMV", "gmv"],
    ["gvm", "gmv"],
    ["จีเอ็มวี", "gmv"],
    ["ยอดขาย", "gmv"],
    ["cvr", "cr"],
    ["conversion rate", "cr"],
    ["roas", "roas"],
    ["raos", "roas"],
    ["deadair", "dead-air"],
    ["เด็ดแอร์", "dead-air"],
    ["add to cart", "add-to-cart-rate"],
    ["p&l", "p-and-l"],
    ["สปาร์คโค้ด", "gen-code"],
    ["kol", "kol"],
    ["fomo", "fomo"],
    ["โฟโม่", "fomo"],
    ["ctor", "ctor"],
    ["withholding", "withholding-tax"],
    ["หัก ณ ที่จ่าย", "withholding-tax"],
    ["shopee", "shopee-live"],
    ["nps", "nps"],
  ])("%s -> %s", (query, id) => {
    expect(top(query)).toBe(id);
  });

  it("recovers queries typed on the wrong keyboard layout", () => {
    expect(thaiLayoutToEnglish("เทอ")).toBe("gmv");
    const result = search("เทอ");
    expect(result.layoutFix).toBe("gmv");
    expect(result.best[0].entry.id).toBe("gmv");
    expect(search("พนฟห").best[0].entry.id).toBe("roas");
  });

  it("points speech/highlight at the variant that was typed", () => {
    const hit = search("cvr").best[0];
    expect(hit.entry.variants[hit.variantIndex].text).toBe("CVR");
  });

  it("never comes back empty", () => {
    const result = search("xqzjv");
    expect(result.best.length).toBeGreaterThan(0);
    expect(result.nearbyOnly).toBe(true);
  });

  it("suggests the rest of the group after the best match", () => {
    const result = search("gmv");
    expect(result.sameGroup.length).toBeGreaterThan(0);
    expect(result.sameGroup.every((hit) => hit.entry.categoryId === "1")).toBe(true);
    expect(result.sameGroup.some((hit) => hit.entry.id === "gmv")).toBe(false);
  });

  it("counts adjacent swaps as one edit", () => {
    expect(editDistance("gvm", "gmv")).toBe(1);
  });
});

describe("speech text", () => {
  it("reads only the searched variant, never the explanation", async () => {
    const { utteranceFor } = await import("./speech");
    const cr = entries.find((entry) => entry.id === "cr")!;
    expect(utteranceFor(cr, 1, true)).toEqual({ text: "ซี วี อาร์", lang: "th" });
    expect(utteranceFor(cr, 1, false)).toEqual({ text: "CVR", lang: "en" });
    const gmv = entries.find((entry) => entry.id === "gmv")!;
    expect(utteranceFor(gmv, 0, true).text).toBe("จี เอ็ม วี");
    const fomo = entries.find((entry) => entry.id === "fomo")!;
    expect(utteranceFor(fomo, 0, true).text).toBe("โฟ โม");
    const pl = entries.find((entry) => entry.id === "p-and-l")!;
    expect(utteranceFor(pl, 0, false).text).toBe("P and L");
  });
});

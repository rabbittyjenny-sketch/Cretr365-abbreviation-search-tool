/**
 * Thai Kedmanee <-> US QWERTY key mapping, used to recover queries typed
 * with the wrong keyboard language (e.g. "เทอ" is "gmv" on a Thai layout).
 */
const PAIRS: [string, string][] = [
  // unshifted
  ["`", "_"], ["1", "ๅ"], ["2", "/"], ["3", "-"], ["4", "ภ"], ["5", "ถ"], ["6", "ุ"], ["7", "ึ"], ["8", "ค"], ["9", "ต"], ["0", "จ"], ["-", "ข"], ["=", "ช"],
  ["q", "ๆ"], ["w", "ไ"], ["e", "ำ"], ["r", "พ"], ["t", "ะ"], ["y", "ั"], ["u", "ี"], ["i", "ร"], ["o", "น"], ["p", "ย"], ["[", "บ"], ["]", "ล"], ["\\", "ฃ"],
  ["a", "ฟ"], ["s", "ห"], ["d", "ก"], ["f", "ด"], ["g", "เ"], ["h", "้"], ["j", "่"], ["k", "า"], ["l", "ส"], [";", "ว"], ["'", "ง"],
  ["z", "ผ"], ["x", "ป"], ["c", "แ"], ["v", "อ"], ["b", "ิ"], ["n", "ื"], ["m", "ท"], [",", "ม"], [".", "ใ"], ["/", "ฝ"],
  // shifted
  ["~", "%"], ["!", "+"], ["@", "๑"], ["#", "๒"], ["$", "๓"], ["%", "๔"], ["^", "ู"], ["&", "฿"], ["*", "๕"], ["(", "๖"], [")", "๗"], ["_", "๘"], ["+", "๙"],
  ["Q", "๐"], ["W", "\""], ["E", "ฎ"], ["R", "ฑ"], ["T", "ธ"], ["Y", "ํ"], ["U", "๊"], ["I", "ณ"], ["O", "ฯ"], ["P", "ญ"], ["{", "ฐ"], ["}", ","], ["|", "ฅ"],
  ["A", "ฤ"], ["S", "ฆ"], ["D", "ฏ"], ["F", "โ"], ["G", "ฌ"], ["H", "็"], ["J", "๋"], ["K", "ษ"], ["L", "ศ"], [":", "ซ"], ["\"", "."],
  ["Z", "("], ["X", ")"], ["C", "ฉ"], ["V", "ฮ"], ["B", "ฺ"], ["N", "์"], ["M", "?"], ["<", "ฒ"], [">", "ฬ"], ["?", "ฦ"],
];

const THAI_TO_EN = new Map<string, string>();
const EN_TO_THAI = new Map<string, string>();
for (const [en, th] of PAIRS) {
  if (/[฀-๿]/.test(th)) THAI_TO_EN.set(th, en);
  EN_TO_THAI.set(en, th);
}

export const hasThai = (value: string) => /[฀-๿]/.test(value);
export const hasLatin = (value: string) => /[A-Za-z]/.test(value);

/** "เทอ" -> "gmv". Characters without a mapping are kept. */
export function thaiLayoutToEnglish(value: string) {
  return Array.from(value, (char) => THAI_TO_EN.get(char) ?? char).join("");
}

/** "pvf-kp" -> "ยอดขาย". Only lowercase/unshifted keys plus common shifted ones. */
export function englishLayoutToThai(value: string) {
  return Array.from(value, (char) => (char === " " ? " " : EN_TO_THAI.get(char) ?? char)).join("");
}

/**
 * IMAGE SLOTS
 * -----------
 * Drop a file into src/assets/images/ named exactly like a slot below
 * (any of .png .jpg .jpeg .webp .svg .gif .avif) and it replaces the built-in
 * doodle automatically on the next build. Nothing else needs to change.
 *
 *   e.g. src/assets/images/onboarding-1.png
 *        src/assets/images/category-7.webp
 *
 * Transparent PNG/WebP line art on a clear background looks best on the paper colour.
 */
export const IMAGE_SLOTS = {
  "onboarding-1": { where: "หน้าแนะนำ 1/3 — Search.", size: "720 × 540" },
  "onboarding-2": { where: "หน้าแนะนำ 2/3 — Listen.", size: "720 × 540" },
  "onboarding-3": { where: "หน้าแนะนำ 3/3 — Save.", size: "720 × 540" },
  "home-hero": { where: "หน้าแรก ใต้หัวข้อใหญ่", size: "680 × 420" },
  "must-know": { where: "บล็อกดำ '18 คำที่ต้องรู้' (เส้นสีขาว/โปร่งใส)", size: "320 × 260" },
  "category-1": { where: "ไอคอนหมวด 1 ยอดขายและประสิทธิภาพ", size: "240 × 240" },
  "category-2": { where: "ไอคอนหมวด 2 ผู้ชมและ Algorithm", size: "240 × 240" },
  "category-3": { where: "ไอคอนหมวด 3 พฤติกรรมและการมีส่วนร่วม", size: "240 × 240" },
  "category-4": { where: "ไอคอนหมวด 4 แพลตฟอร์ม เครื่องมือ", size: "240 × 240" },
  "category-5": { where: "ไอคอนหมวด 5 จิตวิทยาและเทคนิคเนื้อหา", size: "240 × 240" },
  "category-6": { where: "ไอคอนหมวด 6 การเงินและธุรกิจ", size: "240 × 240" },
  "category-7": { where: "ไอคอนหมวด 7 กฎหมาย (Compliance)", size: "240 × 240" },
  "category-8": { where: "ไอคอนหมวด 8 ระบบนิเวศครีเอเตอร์", size: "240 × 240" },
  "category-9": { where: "ไอคอนหมวด 9 งานจ้าง สัญญา", size: "240 × 240" },
  "category-10": { where: "ไอคอนหมวด 10 โปรดักชันและโฆษณา", size: "240 × 240" },
  "category-11": { where: "ไอคอนหมวด 11 ตัวย่อในคอร์ส / Content Planner", size: "240 × 240" },
  "category-12": { where: "ไอคอนหมวด 12 ภาคผนวก", size: "240 × 240" },
  "saved-empty": { where: "สมุดคำ ตอนยังไม่มีคำที่บันทึก", size: "480 × 360" },
  "nearby": { where: "แถบ 'คำที่ใกล้เคียงที่สุด' ตอนพิมพ์ไม่ตรงคำไหน", size: "320 × 220" },
  "about-hero": { where: "หน้าข้อมูลเพิ่มเติม ด้านบน", size: "640 × 340" },
  "desk-left": { where: "ตกแต่งซ้ายของกรอบมือถือ (เฉพาะจอคอม)", size: "440 × 600" },
  "desk-right": { where: "ตกแต่งขวาของกรอบมือถือ (เฉพาะจอคอม)", size: "440 × 600" },
  "logo": { where: "โลโก้มุมซ้ายบน แทนตัวอักษร Glossary.", size: "สูง 56 px (กว้างตามสัดส่วน)" },
} as const;

export type ImageSlot = keyof typeof IMAGE_SLOTS;

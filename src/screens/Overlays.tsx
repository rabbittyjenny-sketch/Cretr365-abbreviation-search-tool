import { useRef, useState, type ReactNode } from "react";
import { Art } from "../components/Art";
import { IconBook, IconClose, IconGrid, IconInfo, IconSparkle, IconStar, SceneListen, SceneSave, SceneSearch } from "../components/doodles";
import { Wordmark } from "../components/ui";
import type { ImageSlot } from "../config/images";
import { useApp } from "../context";
import type { VoiceMode } from "../lib/speech";

const SLIDES: { word: string; kicker?: string; slot: ImageSlot; body: ReactNode; Fallback: typeof SceneSearch }[] = [
  {
    word: "KUM-TEM",
    kicker: "คำเต็ม",
    slot: "onboarding-1",
    body: (
      <>
        ตัวย่อที่ยุ่งยาก? ไม่อยากยืนงง
        <br />
        ก็ส่งมาให้<span className="stretch">ยืดดดดดด</span>
      </>
    ),
    Fallback: SceneSearch,
  },
  { word: "Listen", slot: "onboarding-2", body: "กดลำโพงเพื่อฟังวิธีอ่านเฉพาะคำนั้น ไม่อ่านยาวทั้งย่อหน้า พูดตามได้ทันที", Fallback: SceneListen },
  { word: "Save", slot: "onboarding-3", body: "เก็บคำที่ใช้บ่อยไว้ในสมุดคำ แล้วไล่ดูคำในหมวดเดียวกันต่อได้เลย", Fallback: SceneSave },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const touch = useRef<number | null>(null);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;
  const next = () => (last ? onDone() : setIndex(index + 1));

  return (
    <div
      className="onboarding"
      role="dialog"
      aria-label="แนะนำการใช้งาน"
      onTouchStart={(event) => (touch.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touch.current === null) return;
        const delta = event.changedTouches[0].clientX - touch.current;
        if (delta < -40) next();
        if (delta > 40 && index > 0) setIndex(index - 1);
        touch.current = null;
      }}
    >
      <div className="onboarding-top">
        <button className="text-btn" onClick={onDone}>
          ข้าม
        </button>
        <div className="dots" aria-label={`หน้า ${index + 1} จาก ${SLIDES.length}`}>
          {SLIDES.map((item, dot) => (
            <button key={item.word} className={dot === index ? "is-on" : undefined} onClick={() => setIndex(dot)} aria-label={`ไปหน้า ${dot + 1}`} />
          ))}
        </div>
      </div>
      <div className="onboarding-body" key={slide.word}>
        {slide.kicker ? <p className="onboarding-kicker">{slide.kicker}</p> : null}
        <h1 className={`onboarding-word ${slide.kicker ? "onboarding-word--brand" : ""}`} lang="en">
          {slide.word}
          <span className="wordmark-dot" aria-hidden />
        </h1>
        <p className="onboarding-text">{slide.body}</p>
        <Art slot={slide.slot} className="onboarding-art" fallback={<slide.Fallback />} />
      </div>
      <div className="onboarding-actions">
        <button className="btn btn--paper btn--wide" onClick={next}>
          {last ? "เริ่มใช้งาน" : "ถัดไป"}
        </button>
      </div>
    </div>
  );
}

export function Menu({ onClose }: { onClose: () => void }) {
  const { go, speech, openIntro, savedIds } = useApp();
  const pick = (action: () => void) => {
    onClose();
    action();
  };
  const voiceOptions: { value: VoiceMode; label: string }[] = [
    { value: "auto", label: "อัตโนมัติ" },
    { value: "th", label: "ไทย" },
    { value: "en", label: "EN" },
  ];
  return (
    <div className="sheet-layer" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="เมนู" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-head">
          <Wordmark small />
          <button className="icon-btn" onClick={onClose} aria-label="ปิดเมนู">
            <IconClose />
          </button>
        </div>
        <nav className="sheet-links">
          <button onClick={() => pick(() => go({ name: "saved" }))}>
            <IconStar /> สมุดคำ <span className="muted">{savedIds.length}</span>
          </button>
          <button onClick={() => pick(() => go({ name: "must" }))}>
            <IconSparkle /> 18 คำที่ต้องรู้
          </button>
          <button onClick={() => pick(() => go({ name: "az" }))}>
            <IconGrid /> ดัชนี A–Z
          </button>
          <button onClick={() => pick(() => go({ name: "about" }))}>
            <IconInfo /> ข้อมูลเพิ่มเติม & แหล่งที่มา
          </button>
          <button onClick={() => pick(openIntro)}>
            <IconBook /> ดูหน้าแนะนำอีกครั้ง
          </button>
        </nav>
        {speech.supported ? (
          <div className="sheet-voice">
            <span className="hand-note">เสียงอ่าน</span>
            <div className="segmented segmented--small" role="radiogroup" aria-label="เสียงอ่าน">
              {voiceOptions.map((option) => (
                <button key={option.value} role="radio" aria-checked={speech.mode === option.value} className={speech.mode === option.value ? "is-on" : undefined} onClick={() => speech.setMode(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

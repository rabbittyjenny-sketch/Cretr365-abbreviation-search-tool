import type { ReactNode } from "react";
import { getCategory } from "../data/glossary";
import type { Entry } from "../data/types";
import type { Speech } from "../lib/speech";
import { useApp } from "../context";
import { IconArrow, IconBack, IconHome, IconSpeaker, IconStar } from "./doodles";

export function Wordmark({ small = false, thai = false }: { small?: boolean; thai?: boolean }) {
  return (
    <span className={`wordmark ${small ? "wordmark--small" : ""}`}>
      KUM-TEM<span className="wordmark-dot" aria-hidden />
      {thai ? <span className="wordmark-th">คำเต็ม</span> : null}
    </span>
  );
}

export function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={`squiggle ${className ?? ""}`} viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden>
      <path d="M2 6 C 12 2, 20 9, 30 5 S 48 2, 58 6 S 78 9, 88 5 S 108 2, 118 6" />
    </svg>
  );
}

export function SectionTitle({ children, note, count }: { children: ReactNode; note?: string; count?: number }) {
  return (
    <div className="section-title">
      <h2>
        {children}
        {typeof count === "number" ? <span className="count">{count}</span> : null}
      </h2>
      {note ? <span className="hand-note">{note}</span> : null}
      <Squiggle />
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="ย้อนกลับ">
          <IconBack />
        </button>
      ) : null}
      <HomeButton />
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">{right}</div>
    </header>
  );
}

/** Jumps straight back to the first page, however deep the user has gone. */
function HomeButton() {
  const { go } = useApp();
  return (
    <button className="icon-btn" onClick={() => go({ name: "home" })} aria-label="กลับหน้าแรก" title="หน้าแรก">
      <IconHome />
    </button>
  );
}

/** Reads the term's full name aloud (คำเต็ม), not the abbreviation. */
export function SpeakButton({ entry, speech, label, inverted = false }: { entry: Entry; speech: Speech; label?: string; inverted?: boolean }) {
  if (!speech.supported) return null;
  const active = speech.speakingId === entry.id;
  return (
    <button
      className={`speak-btn ${label ? "speak-btn--label" : ""} ${inverted ? "speak-btn--inverted" : ""} ${active ? "is-speaking" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        speech.speak(entry);
      }}
      aria-label={`ฟังคำเต็มของ ${entry.term}`}
    >
      <IconSpeaker active={active} size={20} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}

export function SaveButton({ saved, onToggle, inverted = false }: { saved: boolean; onToggle: () => void; inverted?: boolean }) {
  return (
    <button
      className={`icon-btn ${saved ? "is-saved" : ""} ${inverted ? "icon-btn--inverted" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? "นำออกจากสมุดคำ" : "เก็บไว้ในสมุดคำ"}
    >
      <IconStar filled={saved} />
    </button>
  );
}

/** Highlights the part of `text` the user typed, with a lime marker. */
export function Marked({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}

export type RowTag = string | undefined;

export function TermRow({
  entry,
  variantIndex = 0,
  query,
  tag,
  speech,
  onOpen,
  compact = false,
  showCategory = false,
}: {
  entry: Entry;
  variantIndex?: number;
  query?: string;
  tag?: RowTag;
  speech: Speech;
  onOpen: () => void;
  compact?: boolean;
  showCategory?: boolean;
}) {
  const variant = entry.variants[variantIndex];
  const pointsAtVariant = variant && variantIndex > 0;
  return (
    <li className={`row ${compact ? "row--compact" : ""}`}>
      <button className="row-main" onClick={onOpen}>
        <span className="row-term">
          <Marked text={entry.term} query={query} />
        </span>
        {pointsAtVariant && variant.pron ? (
          <span className="row-pron">
            {variant.text} ({variant.pron})
          </span>
        ) : entry.pronunciation ? (
          <span className="row-pron">({entry.pronunciation})</span>
        ) : null}
        {entry.fullName ? <span className="row-full">{shortFullName(entry.fullName)}</span> : null}
        {!compact ? <span className="row-summary">{entry.summary}</span> : null}
        <span className="row-meta">
          {showCategory ? <span>หมวด {getCategory(entry.categoryId)?.num} · {getCategory(entry.categoryId)?.title}</span> : null}
          {tag ? <span className="row-tag">{tag}</span> : null}
          {entry.mustKnow ? <span className="row-tag row-tag--lime">ต้องรู้</span> : null}
        </span>
      </button>
      <div className="row-actions">
        <SpeakButton entry={entry} speech={speech} />
        <span className="row-go" aria-hidden>
          <IconArrow size={18} />
        </span>
      </div>
    </li>
  );
}

/** Big display terms shrink for long names like "Watch Time / Stay Duration / ...". */
export const termSize = (term: string) => (term.length <= 10 ? undefined : term.length <= 20 ? "m" : "s");

/** "Live Health Score (คะแนนสุขภาพไลฟ์) — คะแนนรวมของ Creatr365" -> text before the dash. */
export const shortFullName = (fullName: string) => fullName.split(" — ")[0];

export function Credit() {
  return (
    <footer className="credit">
      <p>© 2026 All rights reserved | Created by iDEAS365 x Generative AI</p>
      <p>
        Contact : <a href="mailto:hello@ideas365.space">hello@ideas365.space</a>
      </p>
    </footer>
  );
}

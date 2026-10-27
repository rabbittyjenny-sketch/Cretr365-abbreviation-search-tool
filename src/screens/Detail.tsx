import { useMemo, useState } from "react";
import { IconBack, IconCopy } from "../components/doodles";
import { Rich, RichField } from "../components/Rich";
import { SaveButton, SectionTitle, SpeakButton, TermRow, termSize, TopBar } from "../components/ui";
import { entries, entriesInCategory, getCategory, getEntry } from "../data/glossary";
import type { Entry } from "../data/types";
import { useApp } from "../context";
import { LABEL_INFO, stripMd, toneFor } from "../lib/markdown";

/** Other glossary terms written inside this entry's text, for quick hopping. */
function mentionedTerms(entry: Entry) {
  const text = [entry.summary, ...entry.fields.map((field) => stripMd(field.value)), ...entry.extraBlocks.flatMap((block) => block.fields.map((field) => stripMd(field.value)))].join(" ");
  const found: Entry[] = [];
  for (const other of entries) {
    if (other.id === entry.id) continue;
    const fullName = other.fullName.replace(/\([^)]*\)/g, "").trim();
    const names = [...other.variants.map((variant) => variant.text), ...(/^[A-Za-z][A-Za-z -]{8,}$/.test(fullName) && /\s/.test(fullName) ? [fullName] : [])];
    const hit = names.some((name) => {
      const acronym = /^[A-Z0-9&]{2,6}$/.test(name);
      const multiword = /\s/.test(name) && name.length > 5;
      if (!acronym && !multiword && !(other.mustKnow && name.length > 3)) return false;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, acronym ? "" : "i").test(text);
    });
    if (hit) found.push(other);
  }
  return found.slice(0, 12);
}

export function Detail({ id, variantIndex = 0 }: { id: string; variantIndex?: number }) {
  const { back, go, speech, isSaved, toggleSaved } = useApp();
  const entry = getEntry(id);
  const [copied, setCopied] = useState(false);
  const mentions = useMemo(() => (entry ? mentionedTerms(entry) : []), [entry]);

  if (!entry) {
    return (
      <div className="screen-scroll">
        <TopBar onBack={back} title="ไม่พบหน้านี้" />
        <p className="pad">ลิงก์นี้อาจเปลี่ยนไปแล้ว ลองค้นหาคำอีกครั้งจากหน้าแรก</p>
      </div>
    );
  }

  const category = getCategory(entry.categoryId);
  const siblings = entriesInCategory(entry.categoryId);
  const position = siblings.findIndex((item) => item.id === entry.id);
  const prev = siblings[position - 1];
  const next = siblings[position + 1];
  const sameGroup = siblings.filter((item) => item.id !== entry.id).slice(0, 6);
  const tones = entry.labels.map((label) => toneFor(label)).filter(Boolean) as (keyof typeof LABEL_INFO)[];
  const hasPairs = entry.variants.filter((variant) => variant.pron).length > 1;

  const copyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("embed");
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked (e.g. inside some iframes) — nothing else to do
    }
  };

  return (
    <div className="screen-with-bar">
      <div className="screen-scroll" data-screen="term">
        <TopBar
          onBack={back}
          title={<button className="crumb" onClick={() => category && go({ name: "category", id: category.id })}>{category ? `${String(category.num).padStart(2, "0")} · ${category.title}` : ""}</button>}
          right={<SaveButton saved={isSaved(entry.id)} onToggle={() => toggleSaved(entry.id)} />}
        />

        <article className="term">
          <div className="term-head">
            <h1 className="term-title" data-size={termSize(entry.term)}>
              {entry.term}
            </h1>
            <SpeakButton entry={entry} variantIndex={variantIndex} speech={speech} />
          </div>

          {hasPairs ? (
            <ul className="readings">
              {entry.variants.map((variant, index) =>
                variant.pron ? (
                  <li key={variant.text} className={index === variantIndex ? "is-current" : undefined}>
                    <span className="readings-term">{variant.text}</span>
                    <span className="readings-pron">อ่านว่า {variant.pron}</span>
                    <SpeakButton entry={entry} variantIndex={index} speech={speech} />
                  </li>
                ) : null,
              )}
            </ul>
          ) : entry.pronunciation ? (
            <p className="term-pron">
              อ่านว่า <strong>{entry.pronunciation}</strong>
            </p>
          ) : null}

          {entry.fullName ? <p className="term-full">{entry.fullName}</p> : null}

          {tones.length || entry.mustKnow ? (
            <div className="term-tags">
              {entry.mustKnow ? <span className="tag tag--lime">คำที่ต้องรู้</span> : null}
              {tones.map((tone) => (
                <span key={tone} className={`tag tag--${tone}`} title={LABEL_INFO[tone].note}>
                  {LABEL_INFO[tone].name}
                </span>
              ))}
            </div>
          ) : null}

          {entry.fields.map((field, index) => (
            <section key={`${field.label}-${index}`} className={`field ${field.label === "ความหมาย" ? "field--lead" : ""}`}>
              <h2 className="field-label">{field.label}</h2>
              {field.label === "ความหมาย" ? (
                <p className="field-text">
                  <Rich value={field.value} />
                </p>
              ) : (
                <RichField value={field.value} label={field.label} />
              )}
            </section>
          ))}

          {entry.extraBlocks.map((block, blockIndex) => (
            <section key={blockIndex} className="extra">
              <p className="extra-source">อ้างถึงอีกครั้งใน {block.source}</p>
              {block.fields.map((field, index) => (
                <div key={index} className="field field--small">
                  <h3 className="field-label">{field.label}</h3>
                  <RichField value={field.value} label={field.label} />
                </div>
              ))}
            </section>
          ))}

          <p className="term-section">
            ที่มาในคลังคำ: <Rich value={entry.section} />
          </p>

          <button className="text-btn copy-btn" onClick={copyLink}>
            <IconCopy size={18} /> {copied ? "คัดลอกลิงก์แล้ว" : "คัดลอกลิงก์คำนี้"}
          </button>
        </article>

        {mentions.length ? (
          <section className="pad-x">
            <SectionTitle note="ที่ถูกพูดถึงในคำอธิบาย">คำที่เกี่ยวข้อง</SectionTitle>
            <div className="chips">
              {mentions.map((item) => (
                <button key={item.id} className="chip chip--term" onClick={() => go({ name: "term", id: item.id })}>
                  {item.variants[0]?.text ?? item.term}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {sameGroup.length ? (
          <section className="pad-x">
            <SectionTitle note={category ? `หมวด ${category.num}` : undefined}>คำในกลุ่มเดียวกัน</SectionTitle>
            <ul className="rows">
              {sameGroup.map((item) => (
                <TermRow key={item.id} entry={item} speech={speech} onOpen={() => go({ name: "term", id: item.id })} compact />
              ))}
            </ul>
          </section>
        ) : null}
        <div className="bar-spacer" />
      </div>

      <nav className="step-bar" aria-label="คำก่อนหน้าและถัดไปในหมวด">
        <button className="btn btn--line" disabled={!prev} onClick={() => prev && go({ name: "term", id: prev.id })}>
          <IconBack size={18} /> {prev ? prev.variants[0]?.text ?? prev.term : "ก่อนหน้า"}
        </button>
        <button className="btn btn--ink" disabled={!next} onClick={() => next && go({ name: "term", id: next.id })}>
          {next ? `ถัดไป` : "จบหมวด"} <span className="step-count">{position + 1}/{siblings.length}</span>
        </button>
      </nav>
    </div>
  );
}

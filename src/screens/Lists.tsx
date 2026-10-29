import { useMemo, useRef } from "react";
import { Art } from "../components/Art";
import { CategoryDoodle, SceneMustKnow, SceneNotebook } from "../components/doodles";
import { SectionTitle, TermRow, TopBar } from "../components/ui";
import { entries, entriesInCategory, getCategory, getEntry, mustKnow } from "../data/glossary";
import type { ImageSlot } from "../config/images";
import type { Entry } from "../data/types";
import { useApp } from "../context";

function EntryList({ items, showCategory = false }: { items: Entry[]; showCategory?: boolean }) {
  const { go, speech } = useApp();
  return (
    <ul className="rows">
      {items.map((entry) => (
        <TermRow key={entry.id} entry={entry} speech={speech} onOpen={() => go({ name: "term", id: entry.id })} showCategory={showCategory} />
      ))}
    </ul>
  );
}

export function CategoryScreen({ id }: { id: string }) {
  const { back } = useApp();
  const category = getCategory(id);
  const items = entriesInCategory(id);
  if (!category) {
    return (
      <div className="screen-scroll">
        <TopBar onBack={back} title="ไม่พบหมวดนี้" />
      </div>
    );
  }
  return (
    <div className="screen-scroll" data-screen="category">
      <TopBar onBack={back} title={<span className="topbar-label">หมวด {category.num}</span>} />
      <section className="list-hero">
        <Art slot={`category-${category.num}` as ImageSlot} className="list-hero-art" fallback={<CategoryDoodle id={category.id} />} />
        <div>
          <p className="eyebrow">{category.en}</p>
          <h1>{category.title}</h1>
        </div>
      </section>
      {category.intro ? <p className="list-intro">{category.intro.replace(/\\/g, "")}</p> : null}
      <div className="pad-x">
        <SectionTitle>คำในหมวดนี้</SectionTitle>
        <EntryList items={items} />
      </div>
    </div>
  );
}

export function MustKnowScreen() {
  const { back } = useApp();
  return (
    <div className="screen-scroll" data-screen="must">
      <TopBar onBack={back} title={<span className="topbar-label">Glossary 18 คำ</span>} />
      <section className="list-hero list-hero--ink">
        <Art slot="must-know" className="list-hero-art" fallback={<SceneMustKnow />} />
        <div>
          <p className="eyebrow">เริ่มตรงนี้</p>
          <h1>{mustKnow.length} คำที่ต้องรู้</h1>
        </div>
      </section>
      <p className="list-intro">ชุดคำพื้นฐานที่ใช้ในทุกไลฟ์ เรียงตามหมวด — กดลำโพงเพื่อฟังเฉพาะคำนั้น</p>
      <div className="pad-x">
        <EntryList items={mustKnow} showCategory />
      </div>
    </div>
  );
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterOf = (entry: Entry) => {
  const first = entry.term.replace(/^[^A-Za-z0-9ก-๙]+/, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
};

export function AZScreen() {
  const { back } = useApp();
  const scroller = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    [...entries]
      .sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" }))
      .forEach((entry) => map.set(letterOf(entry), [...(map.get(letterOf(entry)) ?? []), entry]));
    return map;
  }, []);

  const jump = (letter: string) => {
    const target = scroller.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`);
    const bar = scroller.current?.querySelector<HTMLElement>(".az-keys");
    if (target && scroller.current) scroller.current.scrollTo({ top: target.offsetTop - (bar?.offsetHeight ?? 0) - 64, behavior: "smooth" });
  };

  return (
    <div className="screen-scroll" ref={scroller} data-screen="az">
      <TopBar onBack={back} title={<span className="topbar-label">ดัชนี A–Z</span>} />
      <nav className="az-keys" aria-label="ตัวอักษร">
        {[...LETTERS, ...(groups.has("#") ? ["#"] : [])].map((letter) => (
          <button key={letter} className="az-key" disabled={!groups.has(letter)} onClick={() => jump(letter)}>
            {letter}
          </button>
        ))}
      </nav>
      <div className="pad-x">
        {[...LETTERS, "#"].map((letter) => {
          const items = groups.get(letter);
          if (!items) return null;
          return (
            <section key={letter} data-letter={letter} className="az-group">
              <h2 className="az-letter">{letter}</h2>
              <EntryList items={items} showCategory />
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function SavedScreen() {
  const { back, savedIds, clearSaved } = useApp();
  const items = savedIds.map((id) => getEntry(id)).filter((entry): entry is Entry => Boolean(entry));
  return (
    <div className="screen-scroll" data-screen="saved">
      <TopBar
        onBack={back}
        title={<span className="topbar-label">สมุดคำ</span>}
        right={
          items.length ? (
            <button className="text-btn" onClick={() => window.confirm("ล้างคำทั้งหมดในสมุดคำ?") && clearSaved()}>
              ล้างทั้งหมด
            </button>
          ) : null
        }
      />
      {items.length ? (
        <div className="pad-x">
          <SectionTitle count={items.length} note="เก็บไว้ในเครื่องนี้">
            คำที่เก็บไว้
          </SectionTitle>
          <EntryList items={items} showCategory />
        </div>
      ) : (
        <section className="empty">
          <Art slot="saved-empty" className="empty-art" fallback={<SceneNotebook />} />
          <h1>
            สมุดยังว่าง<span className="hero-dot" aria-hidden />
          </h1>
          <p>กดรูปดาว ☆ ที่คำไหนก็ได้ เพื่อเก็บไว้ดูทีหลัง</p>
        </section>
      )}
    </div>
  );
}

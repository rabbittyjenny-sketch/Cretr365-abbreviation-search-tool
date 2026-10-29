import { useMemo, useRef } from "react";
import { Art } from "../components/Art";
import { CategoryDoodle, IconClose, IconGrid, IconInfo, IconMenu, IconSearch, IconStar, SceneDesk, SceneSignpost } from "../components/doodles";
import { Credit, Marked, SaveButton, SectionTitle, shortFullName, SpeakButton, TermRow, termSize, Wordmark } from "../components/ui";
import { categories, entries, entriesInCategory, getCategory } from "../data/glossary";
import type { ImageSlot } from "../config/images";
import { useApp } from "../context";
import { createSearch, type Hit, type MatchType } from "../lib/search";

const engine = createSearch(entries);

const TAGS: Partial<Record<MatchType, string>> = {
  typo: "สะกดใกล้เคียง",
  meaning: "อยู่ในคำอธิบาย",
  contains: "มีคำที่พิมพ์",
};

export function HomeHeader() {
  const { savedIds, go, openMenu } = useApp();
  return (
    <header className="home-header">
      <button className="logo-btn" onClick={() => go({ name: "home" })} aria-label="หน้าแรก">
        <Art slot="logo" className="logo-art" fallback={<Wordmark thai />} alt="KUM-TEM คำเต็ม" />
      </button>
      <div className="home-header-actions">
        <button className="icon-btn icon-btn--count" onClick={() => go({ name: "saved" })} aria-label={`สมุดคำ ${savedIds.length} คำ`}>
          <IconStar filled={savedIds.length > 0} />
          {savedIds.length ? <span className="badge">{savedIds.length}</span> : null}
        </button>
        <button className="icon-btn" onClick={openMenu} aria-label="เมนู">
          <IconMenu />
        </button>
      </div>
    </header>
  );
}

export function Home({ query }: { query: string }) {
  const { replace, remember } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const result = useMemo(() => engine.search(query), [query]);
  const searching = query.trim().length > 0;

  const setQuery = (value: string) => replace({ name: "home", q: value || undefined });

  return (
    <div className="screen-scroll" data-screen="home">
      <HomeHeader />
      {!searching ? (
        <section className="hero">
          <p className="hero-note" lang="en">Alphabet soup? Chill out... I’ll spell 'em out.</p>
          <h1 className="hero-title" lang="en">
            UN-SHORT<span className="hero-dot" aria-hidden />
          </h1>
          <p className="hero-sub">
            จากตัวย่อ ให้เป็น <mark>คำ เต็ม เต็ม</mark>
          </p>
          <p className="hero-lead">รวมคำเต็มๆ ของหลากหลายกลุ่มที่ใช้กัน เพื่อให้ชาว Creatr365 สบายยยย สบายยย</p>
          <Art slot="home-hero" className="hero-art" fallback={<SceneDesk />} />
        </section>
      ) : null}

      <form
        className="search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          remember(query);
          inputRef.current?.blur();
        }}
      >
        <label className="search-box">
          <IconSearch />
          <span className="sr-only">ค้นหาคำศัพท์</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => remember(query)}
            placeholder="พิมพ์ตัวย่อที่อยากยืดดดด ได้เลยย"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            inputMode="search"
          />
          {query ? (
            <button type="button" className="search-clear" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="ล้างคำค้น">
              <IconClose size={18} />
            </button>
          ) : null}
        </label>
      </form>

      {searching ? <Results query={query} result={result} /> : <Browse />}
    </div>
  );
}

function Results({ query, result }: { query: string; result: ReturnType<typeof engine.search> }) {
  const { go, speech, isSaved, toggleSaved, remember } = useApp();
  const shownQuery = result.layoutFix ?? query;
  const open = (hit: Hit) => {
    remember(query);
    go({ name: "term", id: hit.entry.id, v: hit.variantIndex || undefined });
  };
  // A guess shouldn't look like an answer: nearby-only results are listed as plain rows.
  const first = result.nearbyOnly ? undefined : result.best[0];
  const rest = result.nearbyOnly ? result.best : result.best.slice(1);
  const total = result.best.length + result.sameGroup.length + result.mentions.length;
  const anchor = result.best[0];
  const group = anchor ? getCategory(anchor.entry.categoryId) : undefined;

  return (
    <div className="results">
      <p className="sr-only" aria-live="polite">พบ {total} คำ</p>

      {result.layoutFix ? (
        <div className="notice">
          <span className="hand-note">แป้นพิมพ์ยังเป็นภาษา{/[ก-๙]/.test(query) ? "ไทย" : "อังกฤษ"} ↓</span>
          <p>
            แสดงผลของ <strong>“{result.layoutFix}”</strong> ให้แทน “{query}”
          </p>
        </div>
      ) : null}

      {result.nearbyOnly ? (
        <div className="notice notice--nearby">
          <Art slot="nearby" className="notice-art" fallback={<SceneSignpost />} />
          <div>
            <p className="notice-title">คำที่ใกล้เคียง “{query}” ที่สุด</p>
            <p>ลองพิมพ์คำอ่านภาษาไทย ความหมาย หรือแค่ตัวอักษรแรกก็ได้</p>
          </div>
        </div>
      ) : null}

      {first ? (
        <section className="best-card" onClick={() => open(first)} role="link" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && open(first)}>
          <div className="best-top">
            <span className="best-kicker">{first.type === "exact" ? "ตรงคำค้น" : "ใกล้เคียงที่สุด"}</span>
            <SaveButton saved={isSaved(first.entry.id)} onToggle={() => toggleSaved(first.entry.id)} inverted />
          </div>
          <h2 className="best-term" data-size={termSize(first.entry.term)}>
            <Marked text={first.entry.term} query={shownQuery} />
          </h2>
          {first.entry.variants[first.variantIndex]?.pron || first.entry.pronunciation ? (
            <p className="best-reading">({first.entry.variants[first.variantIndex]?.pron ?? first.entry.pronunciation})</p>
          ) : null}
          <div className="best-pron">
            <strong>{shortFullName(first.entry.fullName || first.entry.term)}</strong>
            <SpeakButton entry={first.entry} speech={speech} label="ฟัง" inverted />
          </div>
          <p className="best-summary">{first.entry.summary}</p>
          <span className="best-more">
            อ่านรายละเอียด <span aria-hidden>↗</span>
          </span>
        </section>
      ) : null}

      {rest.length ? (
        <>
          <SectionTitle count={rest.length}>{result.nearbyOnly ? "สะกดใกล้เคียงที่สุด" : "ตรงกับที่ค้นด้วย"}</SectionTitle>
          <ul className="rows">
            {rest.map((hit) => (
              <TermRow key={hit.entry.id} entry={hit.entry} variantIndex={hit.variantIndex} query={shownQuery} tag={TAGS[hit.type]} speech={speech} onOpen={() => open(hit)} showCategory={hit.entry.categoryId !== anchor?.entry.categoryId} />
            ))}
          </ul>
        </>
      ) : null}

      {result.sameGroup.length && group ? (
        <>
          <SectionTitle note={`หมวด ${group.num}`} count={result.sameGroup.length}>
            คำในกลุ่มเดียวกัน
          </SectionTitle>
          <ul className="rows">
            {result.sameGroup.map((hit) => (
              <TermRow key={hit.entry.id} entry={hit.entry} variantIndex={hit.variantIndex} query={shownQuery} speech={speech} onOpen={() => open(hit)} compact />
            ))}
          </ul>
          <button className="link-btn" onClick={() => go({ name: "category", id: group.id })}>
            ดูหมวด “{group.title}” ทั้งหมด ({entriesInCategory(group.id).length} คำ) →
          </button>
        </>
      ) : null}

      {result.mentions.length ? (
        <>
          <SectionTitle count={result.mentions.length}>คำอื่นที่ใกล้เคียง</SectionTitle>
          <ul className="rows">
            {result.mentions.map((hit) => (
              <TermRow key={hit.entry.id} entry={hit.entry} variantIndex={hit.variantIndex} query={shownQuery} tag={TAGS[hit.type]} speech={speech} onOpen={() => open(hit)} compact showCategory />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function Browse() {
  const { go, recent, replace, clearRecent } = useApp();
  return (
    <div className="browse">
      {recent.length ? (
        <section className="recent">
          <div className="recent-head">
            <span className="hand-note">ค้นล่าสุด</span>
            <button className="text-btn" onClick={clearRecent}>
              ล้าง
            </button>
          </div>
          <div className="chips">
            {recent.map((item) => (
              <button key={item} className="chip" onClick={() => replace({ name: "home", q: item })}>
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <SectionTitle count={categories.length} note="แตะเพื่อดูคำในหมวด">
        หมวดหมู่
      </SectionTitle>
      <div className="tiles">
        {categories.map((category) => (
          <button key={category.id} className="tile" onClick={() => go({ name: "category", id: category.id })}>
            <Art slot={`category-${category.num}` as ImageSlot} className="tile-art" fallback={<CategoryDoodle id={category.id} />} />
            <span className="tile-num">{String(category.num).padStart(2, "0")}</span>
            <span className="tile-title">{category.title}</span>
            <span className="tile-meta">{category.en}</span>
          </button>
        ))}
      </div>

      <div className="browse-links">
        <button className="btn btn--line" onClick={() => go({ name: "az" })}>
          <IconGrid size={20} /> ดูทั้งหมด A–Z
        </button>
        <button className="btn btn--line" onClick={() => go({ name: "about" })}>
          <IconInfo size={20} /> ข้อมูลเพิ่มเติม
        </button>
      </div>

      <Credit />
    </div>
  );
}

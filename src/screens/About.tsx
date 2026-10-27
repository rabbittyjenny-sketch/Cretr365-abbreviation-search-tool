import { Art } from "../components/Art";
import { SceneAbout } from "../components/doodles";
import { Rich } from "../components/Rich";
import { SectionTitle, TopBar } from "../components/ui";
import { categories, entries, glossary } from "../data/glossary";
import { useApp } from "../context";
import { LABEL_INFO, splitRow, stripMd, type LabelTone } from "../lib/markdown";
import type { VoiceMode } from "../lib/speech";

/** Minimal block renderer for the appendix: tables, paragraphs, bullets, italics. */
function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: JSX.Element[] = [];
  let table: string[] = [];
  const flush = () => {
    if (table.length >= 2) {
      const header = splitRow(table[0]);
      const rows = table.slice(2).map(splitRow);
      blocks.push(
        <div className="table-wrap" key={`t${blocks.length}`}>
          <table>
            <thead>
              <tr>
                {header.map((cell, index) => (
                  <th key={index}>
                    <Rich value={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, index) => (
                    <td key={index}>
                      <Rich value={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    }
    table = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("|")) {
      table.push(line);
      continue;
    }
    flush();
    if (!line) continue;
    if (/^\*[^*].*[^*]\*$/.test(line)) {
      blocks.push(
        <p className="md-note" key={`n${blocks.length}`}>
          <Rich value={line.slice(1, -1)} />
        </p>,
      );
    } else if (line.startsWith("· ") || line.startsWith("* ")) {
      blocks.push(
        <p className="md-bullet" key={`b${blocks.length}`}>
          <Rich value={line.slice(2)} />
        </p>,
      );
    } else {
      blocks.push(
        <p key={`p${blocks.length}`}>
          <Rich value={line} />
        </p>,
      );
    }
  }
  flush();
  return <div className="md">{blocks}</div>;
}

const ORDER = ["12.3", "12.1", "12.2", "11.3"];
const AUDIT = ["12.4", "12.5", "12.6"];

export function AboutScreen() {
  const { back, speech } = useApp();
  const section = (id: string) => glossary.appendix.find((item) => item.id === id);
  const voiceOptions: { value: VoiceMode; label: string }[] = [
    { value: "auto", label: "อัตโนมัติ" },
    { value: "th", label: "คำอ่านไทย" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="screen-scroll" data-screen="about">
      <TopBar onBack={back} title={<span className="topbar-label">ข้อมูลเพิ่มเติม</span>} />
      <section className="about-hero">
        <Art slot="about-hero" className="about-art" fallback={<SceneAbout />} />
        <h1>
          เกี่ยวกับ KUM-TEM<span className="hero-dot" aria-hidden />
        </h1>
        <p>{stripMd(glossary.docTitle)}</p>
        <p className="muted">
          {entries.length} คำ · {categories.length} หมวด · ข้อมูลทั้งหมดอ่านจากไฟล์คลังคำฉบับเต็ม
        </p>
      </section>

      <div className="pad-x">
        {speech.supported ? (
          <section className="setting">
            <SectionTitle note="ลำโพงจะอ่านเฉพาะคำ ไม่อ่านคำอธิบาย">เสียงอ่าน</SectionTitle>
            <div className="segmented" role="radiogroup" aria-label="เสียงอ่าน">
              {voiceOptions.map((option) => (
                <button key={option.value} role="radio" aria-checked={speech.mode === option.value} className={speech.mode === option.value ? "is-on" : undefined} onClick={() => speech.setMode(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
            <p className="muted small">
              {speech.hasThaiVoice ? "เครื่องนี้มีเสียงภาษาไทย — อ่านตามคำอ่านในคลังคำ" : "ยังไม่พบเสียงภาษาไทยในเครื่องนี้ — โหมดอัตโนมัติจะอ่านคำภาษาอังกฤษแทน"}
            </p>
          </section>
        ) : null}

        <SectionTitle>ป้ายกำกับในคำอธิบาย</SectionTitle>
        <ul className="legend">
          {(Object.keys(LABEL_INFO) as LabelTone[]).map((tone) => (
            <li key={tone}>
              <span className={`tag tag--${tone}`}>{LABEL_INFO[tone].name}</span>
              <span>{LABEL_INFO[tone].note}</span>
            </li>
          ))}
        </ul>

        <SectionTitle>ภาคผนวก</SectionTitle>
        {ORDER.map((id) => {
          const item = section(id);
          if (!item) return null;
          return (
            <details key={id} className="appendix" open={id === "12.3"}>
              <summary>
                <span className="appendix-id">{id}</span> {stripMd(item.title)}
              </summary>
              <Markdown source={item.markdown} />
            </details>
          );
        })}

        <SectionTitle note="สำหรับทีมที่ดูแลเนื้อหา">บันทึกการตรวจข้อมูล</SectionTitle>
        {AUDIT.map((id) => {
          const item = section(id);
          if (!item) return null;
          return (
            <details key={id} className="appendix">
              <summary>
                <span className="appendix-id">{id}</span> {stripMd(item.title)}
              </summary>
              <Markdown source={item.markdown} />
            </details>
          );
        })}

        {section("sources") ? (
          <details className="appendix">
            <summary>แหล่งที่มา</summary>
            <Markdown source={section("sources")!.markdown} />
          </details>
        ) : null}
        <div className="bar-spacer" />
      </div>
    </div>
  );
}

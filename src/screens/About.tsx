import { Art } from "../components/Art";
import { SceneAbout } from "../components/doodles";
import { Rich } from "../components/Rich";
import { Credit, SectionTitle, TopBar } from "../components/ui";
import { glossary } from "../data/glossary";
import { useApp } from "../context";
import { LABEL_INFO, splitRow, stripMd, type LabelTone } from "../lib/markdown";

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

export function AboutScreen() {
  const { back } = useApp();
  const section = (id: string) => glossary.appendix.find((item) => item.id === id);

  return (
    <div className="screen-scroll" data-screen="about">
      <TopBar onBack={back} title={<span className="topbar-label">ข้อมูลเพิ่มเติม</span>} />
      <section className="about-hero">
        <Art slot="about-hero" className="about-art" fallback={<SceneAbout />} />
        <h1>
          เกี่ยวกับ KUM-TEM<span className="hero-dot" aria-hidden />
        </h1>
        <p>รวมคำเต็มๆ ของหลากหลายกลุ่มที่ใช้กัน เพื่อให้ชาว Creatr365 สบายยยย สบายยย — ปุ่มลำโพงอ่านคำเต็มของแต่ละตัวย่อให้ฟัง</p>
      </section>

      <div className="pad-x">

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

        {section("sources") ? (
          <section className="sources">
            <SectionTitle>แหล่งที่มา</SectionTitle>
            <Markdown source={section("sources")!.markdown} />
          </section>
        ) : null}
        <Credit />
      </div>
    </div>
  );
}

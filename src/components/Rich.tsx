import { Fragment } from "react";
import { LABEL_INFO, splitTopLevel, tokenizeInline } from "../lib/markdown";

/** Renders one source cell: bold, links (open in a new tab) and status labels. */
export function Rich({ value }: { value: string }) {
  const tokens = tokenizeInline(value);
  return (
    <>
      {tokens.map((token, index) => {
        if (token.kind === "link") {
          return (
            <a key={index} href={token.href} target="_blank" rel="noopener noreferrer" className={token.bold ? "strong" : undefined}>
              {token.text}
              <span aria-hidden className="ext">↗</span>
            </a>
          );
        }
        if (token.kind === "label") {
          return (
            <Fragment key={index}>
              <span className={`tag tag--${token.tone}`} title={LABEL_INFO[token.tone].note}>
                {token.text}
              </span>
              {token.rest ? <span className="tag-rest">{token.rest}</span> : null}
            </Fragment>
          );
        }
        return token.bold ? <strong key={index}>{token.text}</strong> : <Fragment key={index}>{token.text}</Fragment>;
      })}
    </>
  );
}

/**
 * Field values pack several points into one cell separated by " · " (and
 * platform paths by "\|"). Showing them as a list makes long cells scannable.
 */
export function RichField({ value, label }: { value: string; label: string }) {
  let parts = splitTopLevel(value, " · ");
  if (label.startsWith("ดูได้ที่")) parts = parts.flatMap((part) => splitTopLevel(part, " \\| "));
  parts = parts.map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
    return (
      <p className="field-text">
        <Rich value={value} />
      </p>
    );
  }
  return (
    <ul className="field-list">
      {parts.map((part, index) => (
        <li key={index}>
          <Rich value={part} />
        </li>
      ))}
    </ul>
  );
}

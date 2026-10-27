import { Fragment } from "react";
import { LABEL_INFO, tokenizeInline } from "../lib/markdown";

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

/** Splits on `separator` only outside brackets/parentheses, so labels and links stay whole. */
function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "\\" && (value[i + 1] === "[" || value[i + 1] === "]")) {
      depth += value[i + 1] === "[" ? 1 : -1;
      i += 1;
      continue;
    }
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0 && value.startsWith(separator, i)) {
      parts.push(value.slice(start, i));
      start = i + separator.length;
      i += separator.length - 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

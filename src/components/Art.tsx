import type { ReactNode } from "react";
import type { ImageSlot } from "../config/images";

// Collected at build time, so a missing image never causes a 404 at runtime.
const files = import.meta.glob("../assets/images/*.{png,jpg,jpeg,webp,svg,gif,avif}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const bySlot = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");
  bySlot.set(name, url);
}

export const hasArt = (slot: ImageSlot) => bySlot.has(slot);

/** Renders the uploaded image for `slot` if present, otherwise the doodle fallback. */
export function Art({ slot, alt = "", fallback, className }: { slot: ImageSlot; alt?: string; fallback: ReactNode; className?: string }) {
  const url = bySlot.get(slot);
  return (
    <div className={`art ${className ?? ""}`} data-slot={slot}>
      {url ? <img src={url} alt={alt} loading="lazy" decoding="async" /> : fallback}
    </div>
  );
}

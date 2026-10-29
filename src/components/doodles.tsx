import type { ReactNode } from "react";

/**
 * Hand-drawn line art used as the built-in fallback for every image slot.
 * Strokes use currentColor (ink), fills use the .f-* classes in app.css.
 * The shared #wobble filter (see <DoodleDefs/>) gives lines a pencil wobble.
 */

type Props = { className?: string; title?: string };

function Svg({ viewBox, children, className, title }: Props & { viewBox: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} className={`doodle ${className ?? ""}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <g className="doodle-lines" filter="url(#wobble)">
        {children}
      </g>
    </svg>
  );
}

export function DoodleDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/* ---------- shared pieces ---------- */

const Sparkle = ({ x, y, s = 1, lime = false }: { x: number; y: number; s?: number; lime?: boolean }) => (
  <path
    className={lime ? "f-lime" : undefined}
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -10 C 1 -3, 3 -1, 10 0 C 3 1, 1 3, 0 10 C -1 3, -3 1, -10 0 C -3 -1, -1 -3, 0 -10 Z"
  />
);

/** The mascot: a little live-stream phone with antenna ears. Drawn in a 100x130 box. */
function Mascot({ x, y, s = 1, arms, face = "plus" }: { x: number; y: number; s?: number; arms?: ReactNode; face?: "plus" | "happy" | "sing" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M30 23 L 23 5" />
      <circle className="f-ink" cx="23" cy="4" r="3.6" />
      <path d="M70 22 L 79 4" />
      <circle className="f-lime" cx="79" cy="4" r="4.6" />
      <path className="f-card" d="M18 24 C 38 19, 62 19, 82 23 C 89 24, 92 29, 92 37 L 91 96 C 91 104, 86 108, 78 108 L 22 109 C 14 109, 10 105, 10 97 L 9 37 C 9 29, 12 25, 18 24 Z" />
      <rect className="f-lime" x="19" y="31" width="24" height="10" rx="1" strokeWidth="1.6" />
      <text x="31" y="39" className="doodle-text" textAnchor="middle" fontSize="7.5">LIVE</text>
      {face === "plus" ? (
        <path d="M31 58 h9 M35.5 53.5 v9 M58 58 h9 M62.5 53.5 v9" />
      ) : face === "happy" ? (
        <path d="M31 59 Q 35.5 53 40 59 M58 59 Q 62.5 53 67 59" />
      ) : (
        <path d="M31 57 h9 M58 57 h9" />
      )}
      {face === "sing" ? <ellipse className="f-ink" cx="49" cy="76" rx="6" ry="7" /> : <path d="M40 73 Q 49 82 58 73" />}
      <path d="M34 109 L 33 124 L 25 125 M66 109 L 67 124 L 75 125" />
      {arms}
    </g>
  );
}

const Ground = ({ y = 222, x1 = 18, x2 = 302 }: { y?: number; x1?: number; x2?: number }) => (
  <path d={`M${x1} ${y} C ${x1 + 80} ${y - 3}, ${x2 - 120} ${y + 3}, ${x2} ${y - 1}`} />
);

const Books = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path className="f-card" d="M0 30 L 62 30 L 62 44 L 0 44 Z" />
    <path d="M6 37 L 50 37" />
    <path className="f-card" d="M4 16 L 58 15 L 58 30 L 4 30 Z" />
    <path d="M10 22.5 L 48 22.5" />
    <path className="f-lime" d="M8 2 L 56 2 L 56 15 L 8 16 Z" />
    <path d="M14 9 L 44 9" />
  </g>
);

const Cup = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M10 -14 C 6 -20, 14 -24, 10 -30 M20 -14 C 16 -20, 24 -24, 20 -30" />
    <path className="f-card" d="M0 0 L 30 0 L 27 26 C 26 30, 4 30, 3 26 Z" />
    <path className="f-ink" d="M3 4 L 27 4 L 26.4 9 L 3.6 9 Z" />
    <path d="M30 6 C 40 6, 40 18, 28.5 18" />
    <path d="M-6 30 C 6 34, 26 34, 38 30" />
  </g>
);

/* ---------- scenes (image-slot fallbacks) ---------- */

export function SceneSearch(props: Props) {
  return (
    <Svg viewBox="0 0 320 240" {...props}>
      <Sparkle x={262} y={52} s={1.1} lime />
      <Sparkle x={292} y={96} s={0.6} />
      <Sparkle x={40} y={58} s={0.7} />
      <Mascot
        x={46}
        y={84}
        s={1.08}
        arms={<path d="M10 70 C 0 74, -4 86, 2 94 M91 66 C 104 62, 116 56, 128 50" />}
      />
      <circle className="f-card" cx="214" cy="104" r="40" />
      <circle cx="214" cy="104" r="31" strokeWidth="1.6" />
      <text x="214" y="112" className="doodle-display" textAnchor="middle" fontSize="24">GMV</text>
      <path d="M243 133 L 270 162" strokeWidth="7" />
      <path d="M262 176 C 254 200, 270 212, 292 206" strokeDasharray="1 7" />
      <Ground />
    </Svg>
  );
}

export function SceneListen(props: Props) {
  return (
    <Svg viewBox="0 0 320 240" {...props}>
      <Mascot x={34} y={86} s={1.08} face="sing" arms={<path d="M10 70 C 0 66, -6 56, -2 46 M91 70 C 100 76, 104 88, 98 96" />} />
      <path d="M152 140 C 160 132, 160 120, 152 112 M164 150 C 178 136, 178 116, 164 102 M176 160 C 196 140, 196 112, 176 92" />
      <path className="f-card" d="M190 34 L 300 32 C 306 32, 308 36, 308 42 L 308 92 C 308 98, 304 100, 298 100 L 234 101 L 214 120 L 218 101 L 196 101 C 190 101, 188 98, 188 92 L 186 42 C 186 37, 186 34, 190 34 Z" />
      <text x="247" y="73" className="doodle-text" textAnchor="middle" fontSize="19">จี-เอ็ม-วี</text>
      <path className="lime-stroke" d="M212 84 C 230 88, 262 88, 284 84" strokeWidth="5" />
      <Sparkle x={292} y={150} s={0.9} lime />
      <Sparkle x={262} y={190} s={0.55} />
      <Ground />
    </Svg>
  );
}

export function SceneSave(props: Props) {
  return (
    <Svg viewBox="0 0 320 240" {...props}>
      <Books x={18} y={176} />
      <Mascot
        x={104}
        y={80}
        s={1.02}
        face="happy"
        arms={
          <>
            <path d="M10 72 C 2 78, 4 90, 16 92 M90 72 C 98 78, 96 90, 84 92" />
            <path className="f-card" d="M14 82 L 86 80 L 88 118 L 12 120 Z" />
            <path d="M50 81 L 50 119" strokeWidth="1.6" />
            <path className="f-lime" d="M30 92 L 33 99 L 40 99 L 34.5 103.5 L 37 111 L 30 106.5 L 23 111 L 25.5 103.5 L 20 99 L 27 99 Z" />
            <path d="M58 93 L 78 93 M58 101 L 78 101 M58 109 L 72 109" strokeWidth="1.6" />
          </>
        }
      />
      <Cup x={248} y={190} />
      <Sparkle x={262} y={60} s={0.9} />
      <Sparkle x={58} y={70} s={1} lime />
      <Ground />
    </Svg>
  );
}

export function SceneDesk(props: Props) {
  return (
    <Svg viewBox="0 0 340 210" {...props}>
      <Sparkle x={300} y={34} s={0.9} lime />
      <Sparkle x={34} y={40} s={0.6} />
      <Books x={16} y={142} />
      <Mascot
        x={112}
        y={36}
        s={1.06}
        face="plus"
        arms={<path d="M12 74 C 18 98, 40 112, 56 116 M90 74 C 92 92, 84 106, 74 114" />}
      />
      <path className="f-card" d="M150 160 L 222 156 L 228 190 L 154 193 Z" />
      <path d="M162 170 L 212 168 M164 178 L 206 177" strokeWidth="1.6" />
      <path d="M174 152 L 196 132 L 200 136 L 178 156 Z" />
      <Cup x={262} y={160} />
      <path d="M6 194 C 110 190, 230 196, 334 192" />
    </Svg>
  );
}

export function SceneNotebook(props: Props) {
  return (
    <Svg viewBox="0 0 240 180" {...props}>
      <path className="f-card" d="M20 40 C 60 32, 100 34, 120 46 C 140 34, 180 32, 220 40 L 220 148 C 180 140, 140 142, 120 154 C 100 142, 60 140, 20 148 Z" />
      <path d="M120 46 L 120 154" />
      <path d="M36 66 L 100 62 M36 82 L 96 79 M36 98 L 90 96" strokeWidth="1.6" />
      <path className="f-lime" d="M170 66 L 175 79 L 189 79 L 178 88 L 182 102 L 170 94 L 158 102 L 162 88 L 151 79 L 165 79 Z" />
      <path d="M150 118 L 196 116" strokeDasharray="2 6" />
      <path d="M196 20 L 214 38 L 160 92 L 140 98 L 146 78 Z" className="f-card" />
      <path d="M146 78 L 160 92" />
      <Sparkle x={36} y={22} s={0.7} lime />
    </Svg>
  );
}

export function SceneSignpost(props: Props) {
  return (
    <Svg viewBox="0 0 220 150" {...props}>
      <path d="M110 30 L 110 138" strokeWidth="3" />
      <path className="f-card" d="M110 36 L 186 34 L 200 48 L 186 62 L 110 62 Z" />
      <path className="f-lime" d="M110 72 L 40 70 L 26 84 L 40 98 L 110 98 Z" />
      <path d="M126 48 L 170 48 M52 84 L 96 84" strokeWidth="1.6" />
      <path d="M70 140 C 100 136, 130 140, 160 138" />
      <Sparkle x={190} y={110} s={0.7} />
    </Svg>
  );
}

export function SceneAbout(props: Props) {
  return (
    <Svg viewBox="0 0 320 170" {...props}>
      <Books x={24} y={104} />
      <path className="f-card" d="M118 40 L 210 36 L 214 150 L 120 154 Z" />
      <path d="M134 62 L 196 60 M134 78 L 194 76 M134 94 L 188 93 M134 110 L 196 108 M134 126 L 170 125" strokeWidth="1.6" />
      <circle className="f-card" cx="230" cy="96" r="28" />
      <path className="lime-stroke" d="M214 96 C 222 90, 238 90, 246 96" strokeWidth="5" />
      <path d="M250 116 L 276 142" strokeWidth="6" />
      <Sparkle x={282} y={44} s={0.9} lime />
      <path d="M12 158 C 110 154, 220 160, 312 156" />
    </Svg>
  );
}

export function SceneMustKnow(props: Props) {
  return (
    <Svg viewBox="0 0 160 130" {...props}>
      <path d="M30 30 L 112 22 L 120 104 L 38 112 Z" transform="rotate(-6 75 67)" />
      <path className="f-card" d="M40 26 L 122 26 L 122 108 L 40 108 Z" />
      <text x="81" y="80" className="doodle-display" textAnchor="middle" fontSize="40">18</text>
      <path className="lime-stroke" d="M56 92 C 72 96, 92 96, 108 92" strokeWidth="4" />
      <Sparkle x={136} y={22} s={0.9} lime />
      <Sparkle x={20} y={100} s={0.6} />
    </Svg>
  );
}

export function SceneDeskLeft(props: Props) {
  return (
    <Svg viewBox="0 0 220 300" {...props}>
      <Books x={30} y={208} />
      <Cup x={140} y={226} />
      <path d="M24 256 L 92 256" />
      <Sparkle x={160} y={120} s={1.1} lime />
      <Sparkle x={60} y={60} s={0.7} />
    </Svg>
  );
}

export function SceneDeskRight(props: Props) {
  return (
    <Svg viewBox="0 0 220 300" {...props}>
      <path className="f-card" d="M70 208 L 150 208 L 140 268 C 139 274, 81 274, 80 268 Z" />
      <path d="M110 208 C 108 170, 96 150, 70 136 M110 206 C 112 168, 126 146, 156 132 M110 200 C 110 160, 110 130, 112 96" />
      <path className="f-lime" d="M70 136 C 54 130, 50 112, 60 104 C 74 108, 80 124, 70 136 Z" />
      <path className="f-card" d="M156 132 C 172 124, 176 108, 166 100 C 152 104, 146 120, 156 132 Z" />
      <path className="f-lime" d="M112 96 C 102 82, 106 64, 118 60 C 126 72, 124 88, 112 96 Z" />
      <path d="M40 276 C 100 272, 150 278, 196 274" />
      <Sparkle x={40} y={70} s={0.9} />
      <Sparkle x={186} y={190} s={0.6} lime />
    </Svg>
  );
}

/* ---------- category icons (64x64) ---------- */

const CATEGORY_ICONS: Record<string, ReactNode> = {
  "1": (
    <>
      <path className="f-card" d="M14 24 L 50 23 L 47 56 L 17 57 Z" />
      <path d="M24 24 C 23 12, 41 12, 40 24" />
      <path className="f-lime" d="M23 44 L 31 36 L 36 41 L 44 32" strokeWidth="3" />
      <path d="M44 32 L 44 38 M44 32 L 38 32" />
    </>
  ),
  "2": (
    <>
      <path className="f-card" d="M6 34 C 18 18, 46 18, 58 34 C 46 50, 18 50, 6 34 Z" />
      <circle className="f-ink" cx="32" cy="34" r="7" />
      <circle className="f-lime" cx="35" cy="31" r="2" strokeWidth="0" />
      <path d="M32 8 L 32 14 M14 12 L 18 17 M50 12 L 46 17" />
    </>
  ),
  "3": (
    <>
      <path className="f-card" d="M8 14 L 40 13 L 40 36 L 22 37 L 14 44 L 15 37 L 8 37 Z" />
      <path className="f-lime" d="M34 36 C 34 30, 42 28, 45 34 C 48 28, 56 30, 56 36 C 56 44, 45 50, 45 50 C 45 50, 34 44, 34 36 Z" />
      <path d="M15 22 L 33 22 M15 29 L 27 29" strokeWidth="1.6" />
    </>
  ),
  "4": (
    <>
      <circle cx="32" cy="24" r="16" />
      <path className="f-card" d="M26 13 L 38 13 L 38 35 L 26 35 Z" />
      <circle className="f-lime" cx="32" cy="30" r="2" strokeWidth="1.2" />
      <path d="M32 40 L 32 48 M32 48 L 20 58 M32 48 L 44 58 M32 48 L 32 58" />
    </>
  ),
  "5": (
    <>
      <path className="f-lime" d="M20 30 C 20 12, 44 12, 44 30 C 44 38, 38 40, 38 46 L 26 46 C 26 40, 20 38, 20 30 Z" />
      <path d="M27 51 L 37 51 M28 56 L 36 56" />
      <path d="M28 34 C 30 28, 34 28, 36 34" strokeWidth="1.6" />
      <path d="M8 22 L 13 24 M56 22 L 51 24 M32 4 L 32 8" />
    </>
  ),
  "6": (
    <>
      <path d="M8 56 L 58 55" />
      <path className="f-card" d="M12 40 L 20 40 L 20 55 L 12 55 Z" />
      <path className="f-card" d="M26 30 L 34 30 L 34 55 L 26 55 Z" />
      <path className="f-lime" d="M40 18 L 48 18 L 48 55 L 40 55 Z" />
      <path d="M10 30 L 22 20 L 30 24 L 50 8 M50 8 L 44 8 M50 8 L 50 14" />
    </>
  ),
  "7": (
    <>
      <path d="M32 8 L 32 54 M20 56 L 44 56 M12 16 L 52 14" />
      <path className="f-card" d="M4 36 L 12 16 L 20 36 C 18 42, 6 42, 4 36 Z" />
      <path className="f-lime" d="M44 34 L 52 14 L 60 34 C 58 40, 46 40, 44 34 Z" />
    </>
  ),
  "8": (
    <>
      <path className="f-card" d="M8 22 L 46 21 L 46 50 L 8 51 Z" />
      <path className="f-lime" d="M46 30 L 58 24 L 58 46 L 46 40 Z" />
      <circle cx="18" cy="14" r="5" />
      <circle cx="32" cy="14" r="5" />
      <path className="f-ink" d="M14 30 L 22 30 L 22 36 L 14 36 Z" />
    </>
  ),
  "9": (
    <>
      <path className="f-card" d="M12 6 L 42 6 L 50 14 L 50 58 L 12 58 Z" />
      <path d="M42 6 L 42 14 L 50 14" />
      <path d="M19 22 L 40 22 M19 30 L 42 30 M19 38 L 34 38" strokeWidth="1.6" />
      <path className="lime-stroke" d="M18 50 C 22 42, 26 54, 30 46 C 33 42, 36 52, 42 46" strokeWidth="3" />
    </>
  ),
  "10": (
    <>
      <path className="f-card" d="M8 26 L 56 26 L 56 56 L 8 56 Z" />
      <path className="f-ink" d="M8 14 L 54 6 L 56 16 L 10 24 Z" />
      <path className="f-lime" d="M18 12.5 L 24 22 L 30 21 L 24 11.5 Z" strokeWidth="0" />
      <path className="f-lime" d="M36 9.5 L 42 19 L 48 18 L 42 8.5 Z" strokeWidth="0" />
      <path d="M8 36 L 56 36" strokeWidth="1.6" />
    </>
  ),
  "11": (
    <>
      <path className="f-ink" d="M4 24 L 32 12 L 60 24 L 32 36 Z" />
      <path className="f-card" d="M16 30 L 16 44 C 24 52, 40 52, 48 44 L 48 30 L 32 37 Z" />
      <path d="M56 26 L 56 42" />
      <circle className="f-lime" cx="56" cy="45" r="3" />
    </>
  ),
  "12": (
    <>
      <path className="f-card" d="M6 10 L 58 10 L 58 54 L 6 54 Z" />
      <path className="lime-stroke" d="M10 44 L 20 36 L 26 40 L 34 22 L 42 30 L 54 16" strokeWidth="3" />
      <path d="M10 48 L 54 48" strokeWidth="1.6" strokeDasharray="2 4" />
    </>
  ),
};

export function CategoryDoodle({ id, ...props }: Props & { id: string }) {
  return (
    <Svg viewBox="0 0 64 64" {...props}>
      {CATEGORY_ICONS[id] ?? CATEGORY_ICONS["12"]}
    </Svg>
  );
}

/* ---------- UI icons (24x24, no wobble so they stay crisp) ---------- */

function Icon({ children, size = 22, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg className={`icon ${className ?? ""}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const IconSearch = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M10.5 3.5 C 15 3.3, 17.6 6.2, 17.4 10.4 C 17.2 14.6, 14.4 17.4, 10.3 17.3 C 6.2 17.2, 3.4 14.5, 3.5 10.4 C 3.6 6.3, 6.3 3.6, 10.5 3.5 Z" />
    <path d="M15.6 15.7 L 20.6 20.6" strokeWidth="2.6" />
  </Icon>
);
export const IconSpeaker = (p: { size?: number; active?: boolean }) => (
  <Icon size={p.size}>
    <path d="M4 9.2 L 7.6 9 L 12.4 4.8 L 12.6 19.2 L 7.6 15 L 4 15 Z" />
    {p.active ? (
      <path className="wave" d="M15.6 9 C 17 10.6, 17 13.4, 15.6 15 M18.4 6.4 C 21.2 9.6, 21.2 14.4, 18.4 17.6" />
    ) : (
      <path d="M15.8 9.4 C 17 10.8, 17 13.2, 15.8 14.6" />
    )}
  </Icon>
);
export const IconStar = (p: { size?: number; filled?: boolean }) => (
  <Icon size={p.size}>
    <path
      className={p.filled ? "f-lime" : undefined}
      d="M12 3.4 L 14.5 8.9 L 20.4 9.5 L 16 13.4 L 17.3 19.3 L 12 16.3 L 6.7 19.3 L 8 13.4 L 3.6 9.5 L 9.5 8.9 Z"
    />
  </Icon>
);
export const IconBack = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M15 4.6 L 7.6 12 L 15.2 19.4" />
  </Icon>
);
export const IconArrow = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4.5 12.2 L 19 11.8 M13.4 6 L 19.2 11.8 L 13.6 17.8" />
  </Icon>
);
export const IconArrowUpRight = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M6.5 17.5 L 17.2 6.8 M9 6.6 L 17.4 6.6 L 17.4 15" />
  </Icon>
);
export const IconMenu = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 8.2 L 20 7.8 M9 15.8 L 20 15.6" />
  </Icon>
);
export const IconClose = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M6 6.2 L 18 17.8 M18 6 L 6.2 18" />
  </Icon>
);
export const IconSparkle = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M12 3 C 12.6 8.6, 15.4 11.4, 21 12 C 15.4 12.6, 12.6 15.4, 12 21 C 11.4 15.4, 8.6 12.6, 3 12 C 8.6 11.4, 11.4 8.6, 12 3 Z" />
  </Icon>
);
export const IconBook = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4 5.6 C 7 4.6, 10 4.8, 12 6.4 C 14 4.8, 17 4.6, 20 5.6 L 20 18.6 C 17 17.6, 14 17.8, 12 19.4 C 10 17.8, 7 17.6, 4 18.6 Z M12 6.4 L 12 19.4" />
  </Icon>
);
export const IconInfo = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M12 3.6 C 17 3.5, 20.5 7, 20.4 12 C 20.3 17, 17 20.4, 12 20.4 C 7 20.4, 3.6 17, 3.6 12 C 3.6 7.2, 7 3.7, 12 3.6 Z" />
    <path d="M12 11 L 12 16.4 M12 7.6 L 12 7.8" />
  </Icon>
);
export const IconCopy = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M8.6 8.4 L 19.4 8.6 L 19.2 19.4 L 8.4 19.2 Z M15.4 8.4 L 15.4 4.6 L 4.6 4.8 L 4.8 15.4 L 8.4 15.4" />
  </Icon>
);
export const IconGrid = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M4.4 4.6 L 10.6 4.4 L 10.4 10.6 L 4.6 10.4 Z M13.4 4.4 L 19.6 4.6 L 19.4 10.4 L 13.6 10.6 Z M4.6 13.4 L 10.4 13.6 L 10.6 19.6 L 4.4 19.4 Z M13.6 13.6 L 19.4 13.4 L 19.6 19.4 L 13.4 19.6 Z" />
  </Icon>
);
export const IconHome = (p: { size?: number }) => (
  <Icon {...p}>
    <path d="M3.6 11.4 L 12 4.2 L 20.4 11.2 M6 9.6 L 6.2 19.6 L 17.8 19.4 L 18 9.6 M10 19.4 L 10.1 14.2 L 13.9 14.1 L 14 19.4" />
  </Icon>
);

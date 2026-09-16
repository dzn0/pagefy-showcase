import { CATEGORIES } from "@/lib/demo-data";

// Planta de bairro desenhada à mão (não é um mapa real): quarteirões, uma
// avenida, uma praça e um rio. Serve de fundo pro mapa da busca e de
// ilustração no início do app.
const COLS: Array<[number, number]> = [
  [0, 62],
  [74, 146],
  [158, 232],
  [244, 318],
  [330, 400],
];
const ROWS: Array<[number, number]> = [
  [0, 66],
  [78, 142],
  [160, 222],
  [234, 300],
];
const PARK = { col: 2, row: 1 };

export function CityBase() {
  return (
    <g>
      <rect width="400" height="300" className="fill-paper" />
      {ROWS.flatMap(([y1, y2], r) =>
        COLS.map(([x1, x2], c) => (
          <rect
            key={`${r}-${c}`}
            x={x1 + 1}
            y={y1 + 1}
            width={x2 - x1 - 2}
            height={y2 - y1 - 2}
            rx="7"
            className={r === PARK.row && c === PARK.col ? "fill-lime-soft" : "fill-surface-2"}
          />
        )),
      )}
      {/* Praça: árvores no quarteirão verde. */}
      {[
        [176, 98],
        [198, 116],
        [214, 94],
        [186, 128],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6.5" className="fill-green" opacity="0.35" />
      ))}
      {/* Avenida principal. */}
      <rect x="0" y="143" width="400" height="16" className="fill-honey-soft" />
      <line x1="0" y1="151" x2="400" y2="151" className="stroke-honey" strokeWidth="1.2" strokeDasharray="7 7" opacity="0.7" />
      {/* Rio. */}
      <path
        d="M288 -10 C 262 60, 330 96, 300 150 S 250 250, 282 310"
        fill="none"
        className="stroke-azure-soft"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M288 -10 C 262 60, 330 96, 300 150 S 250 250, 282 310"
        fill="none"
        className="stroke-azure"
        strokeWidth="1.4"
        opacity="0.45"
      />
    </g>
  );
}

const PINS: Array<{ x: number; y: number; cat: keyof typeof CATEGORIES }> = [
  { x: 34, y: 36, cat: "barbearia" },
  { x: 112, y: 40, cat: "saloes" },
  { x: 200, y: 30, cat: "pet" },
  { x: 36, y: 112, cat: "oficina" },
  { x: 118, y: 104, cat: "restaurantes" },
  { x: 350, y: 110, cat: "presentes" },
  { x: 90, y: 190, cat: "bares" },
  { x: 196, y: 196, cat: "mercados" },
  { x: 366, y: 196, cat: "saloes" },
  { x: 30, y: 262, cat: "pet" },
  { x: 180, y: 266, cat: "barbearia" },
  { x: 360, y: 262, cat: "restaurantes" },
];

/** Ilustração: bairro com os comércios sem site marcados, um deles em destaque. */
export function CityMap({ className = "", highlight = 4 }: { className?: string; highlight?: number }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#141a12" floodOpacity="0.28" />
        </filter>
      </defs>
      <CityBase />
      {PINS.map((pin, i) => {
        const active = i === highlight;
        return (
          <g key={i} transform={`translate(${pin.x} ${pin.y})`} filter="url(#pin-shadow)">
            {active && <circle r="17" className="fill-lime" opacity="0.28" />}
            <path
              d={active ? "M0 4 C -9 -6 -11 -10 -11 -15 A 11 11 0 1 1 11 -15 C 11 -10 9 -6 0 4 Z" : "M0 3 C -6 -4 -7.5 -7 -7.5 -10 A 7.5 7.5 0 1 1 7.5 -10 C 7.5 -7 6 -4 0 3 Z"}
              fill={CATEGORIES[pin.cat].color}
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cy={active ? -15 : -10} r={active ? 3.6 : 2.4} fill="#ffffff" />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Mock hairstyle library for Roxanne AI.
 *
 * Every style is drawn in a 200x220 space built around a reference head:
 * the face is an oval at cx 100, cy 118, rx 50, ry 64 (crown y=54, chin y=182).
 * Shapes are masked so the face stays visible, which is what lets one style
 * sit correctly on any photo once the face is measured.
 */

export const HEAD = { cx: 100, cy: 118, rx: 50, ry: 64 };
export const VIEW = { w: 200, h: 220 };

/** Hairline openings: how much forehead a style leaves showing. */
const OPEN = { cx: 100, cy: 118, rx: 50, ry: 64 };
const OPEN_HIGH = { cx: 100, cy: 127, rx: 47, ry: 55 };
const OPEN_LOW = { cx: 100, cy: 131, rx: 46, ry: 51 };

function ringOfPuffs(cx, cy, radius, puffR, fromDeg, toDeg, step) {
  const puffs = [];
  for (let deg = fromDeg; deg <= toDeg; deg += step) {
    const rad = (deg * Math.PI) / 180;
    puffs.push({
      type: "circle",
      cx: +(cx + radius * Math.cos(rad)).toFixed(1),
      cy: +(cy - radius * Math.sin(rad)).toFixed(1),
      r: puffR,
      tone: "base",
    });
  }
  return puffs;
}

function locStrands() {
  // Columns overlap the crown so strands read as one head of hair; the face
  // mask trims whichever ones pass in front of the cheeks.
  return [32, 50, 68, 132, 150, 168].map((x, i) => ({
    type: "rect",
    x: x - 8,
    y: 96,
    width: 16,
    height: (i % 3 === 1 ? 108 : 96) + (i % 2 ? 8 : 0),
    rx: 8,
    tone: "base",
  }));
}

function braidLinks(centerX) {
  const links = [];
  for (let y = 118; y <= 198; y += 12) {
    links.push({ type: "ellipse", cx: centerX, cy: y, rx: 16, ry: 9.5, tone: "base" });
  }
  return links;
}

export const HAIRSTYLES = [
  {
    id: "afro",
    name: "Afro",
    open: OPEN,
    shapes: [
      { type: "ellipse", cx: 100, cy: 88, rx: 88, ry: 84, tone: "base" },
      ...ringOfPuffs(100, 88, 86, 23, -22, 202, 16),
      { type: "ellipse", cx: 56, cy: 146, rx: 28, ry: 24, tone: "shade" },
      { type: "ellipse", cx: 136, cy: 44, rx: 30, ry: 20, tone: "light" },
    ],
  },
  {
    id: "buzz",
    name: "Buzz Cut",
    open: { cx: 100, cy: 133, rx: 48, ry: 52 },
    shapes: [
      { type: "ellipse", cx: 100, cy: 110, rx: 58, ry: 70, tone: "base" },
      { type: "ellipse", cx: 100, cy: 156, rx: 56, ry: 30, tone: "shade" },
      { type: "ellipse", cx: 120, cy: 54, rx: 26, ry: 12, tone: "light" },
    ],
  },
  {
    id: "pixie",
    name: "Pixie",
    open: { cx: 100, cy: 136, rx: 46, ry: 48 },
    shapes: [
      { type: "ellipse", cx: 100, cy: 106, rx: 61, ry: 70, tone: "base" },
      { type: "ellipse", cx: 52, cy: 128, rx: 16, ry: 34, tone: "base" },
      { type: "ellipse", cx: 148, cy: 128, rx: 16, ry: 34, tone: "base" },
      { type: "ellipse", cx: 60, cy: 148, rx: 18, ry: 22, tone: "shade" },
      { type: "ellipse", cx: 124, cy: 52, rx: 28, ry: 13, tone: "light" },
    ],
    overlay: [
      {
        type: "path",
        d: "M44,104 C46,68 82,44 122,52 C148,57 162,74 158,96 C144,74 116,62 92,68 C70,74 54,86 44,110 Z",
        tone: "base",
      },
      { type: "path", d: "M62,80 C82,64 110,60 132,68", tone: "light", stroke: 7 },
    ],
  },
  {
    id: "bob",
    name: "Sleek Bob",
    open: OPEN,
    shapes: [
      {
        type: "path",
        d: "M24,118 C24,58 56,30 100,30 C144,30 176,58 176,118 L176,158 C176,178 164,190 146,190 L54,190 C36,190 24,178 24,158 Z",
        tone: "base",
      },
      { type: "ellipse", cx: 42, cy: 156, rx: 20, ry: 34, tone: "shade" },
      { type: "ellipse", cx: 132, cy: 52, rx: 32, ry: 15, tone: "light" },
    ],
  },
  {
    id: "curls",
    name: "Curly Bob",
    open: OPEN,
    shapes: [
      { type: "ellipse", cx: 100, cy: 100, rx: 74, ry: 70, tone: "base" },
      ...[
        [32, 82],
        [28, 116],
        [36, 150],
        [54, 176],
        [168, 82],
        [172, 116],
        [164, 150],
        [146, 176],
        [58, 40],
        [100, 30],
        [142, 40],
      ].map(([cx, cy]) => ({ type: "circle", cx, cy, r: 25, tone: "base" })),
      { type: "ellipse", cx: 54, cy: 150, rx: 24, ry: 26, tone: "shade" },
      { type: "ellipse", cx: 132, cy: 46, rx: 26, ry: 16, tone: "light" },
    ],
  },
  {
    id: "waves",
    name: "Long Waves",
    open: OPEN,
    shapes: [
      { type: "ellipse", cx: 100, cy: 98, rx: 68, ry: 64, tone: "base" },
      {
        type: "path",
        d: "M34,92 C18,124 14,158 22,186 C26,206 30,226 42,246 C56,234 66,214 70,190 C74,164 68,128 62,90 Z",
        tone: "base",
      },
      {
        type: "path",
        d: "M166,92 C182,124 186,158 178,186 C174,206 170,226 158,246 C144,234 134,214 130,190 C126,164 132,128 138,90 Z",
        tone: "base",
      },
      { type: "ellipse", cx: 36, cy: 170, rx: 20, ry: 46, tone: "shade" },
      { type: "ellipse", cx: 130, cy: 46, rx: 30, ry: 16, tone: "light" },
      { type: "path", d: "M156,120 C164,152 166,188 160,214", tone: "light", stroke: 6 },
    ],
  },
  {
    id: "straight",
    name: "Straight Long",
    open: OPEN,
    shapes: [
      { type: "ellipse", cx: 100, cy: 96, rx: 64, ry: 60, tone: "base" },
      {
        type: "path",
        d: "M36,94 L30,222 C34,240 56,246 70,234 L68,94 Z",
        tone: "base",
      },
      {
        type: "path",
        d: "M164,94 L170,222 C166,240 144,246 130,234 L132,94 Z",
        tone: "base",
      },
      { type: "ellipse", cx: 40, cy: 176, rx: 14, ry: 44, tone: "shade" },
      { type: "ellipse", cx: 128, cy: 44, rx: 30, ry: 15, tone: "light" },
      { type: "path", d: "M150,96 C154,140 154,182 152,214", tone: "light", stroke: 6 },
    ],
  },
  {
    id: "locs",
    name: "Locs",
    open: OPEN_HIGH,
    shapes: [
      { type: "ellipse", cx: 100, cy: 96, rx: 68, ry: 62, tone: "base" },
      ...locStrands(),
      { type: "ellipse", cx: 44, cy: 168, rx: 18, ry: 34, tone: "shade" },
      { type: "ellipse", cx: 126, cy: 48, rx: 28, ry: 13, tone: "light" },
    ],
  },
  {
    id: "braids",
    name: "Braids",
    open: OPEN_HIGH,
    shapes: [
      { type: "ellipse", cx: 100, cy: 98, rx: 64, ry: 60, tone: "base" },
      ...braidLinks(46),
      ...braidLinks(154),
      { type: "ellipse", cx: 46, cy: 207, rx: 11, ry: 7, tone: "base" },
      { type: "ellipse", cx: 154, cy: 207, rx: 11, ry: 7, tone: "base" },
      { type: "ellipse", cx: 46, cy: 176, rx: 16, ry: 26, tone: "shade" },
      { type: "path", d: "M72,52 C90,42 112,42 130,52", tone: "light", stroke: 7 },
    ],
  },
  {
    id: "ponytail",
    name: "Ponytail",
    open: OPEN_LOW,
    shapes: [
      { type: "ellipse", cx: 100, cy: 108, rx: 58, ry: 68, tone: "base" },
      {
        type: "path",
        d: "M150,96 C178,94 196,116 194,144 C192,174 176,198 158,210 C168,186 172,158 164,136 C158,118 152,104 144,98 Z",
        tone: "base",
      },
      { type: "ellipse", cx: 176, cy: 168, rx: 16, ry: 28, tone: "shade" },
      { type: "path", d: "M56,84 C80,62 122,58 146,76", tone: "light", stroke: 7 },
    ],
  },
  {
    id: "topknot",
    name: "Top Knot",
    open: OPEN_LOW,
    shapes: [
      { type: "ellipse", cx: 100, cy: 110, rx: 56, ry: 68, tone: "base" },
      { type: "circle", cx: 100, cy: 30, r: 29, tone: "base" },
      { type: "ellipse", cx: 100, cy: 54, rx: 22, ry: 12, tone: "base" },
      { type: "circle", cx: 112, cy: 20, r: 12, tone: "light" },
      { type: "ellipse", cx: 62, cy: 140, rx: 18, ry: 26, tone: "shade" },
      { type: "path", d: "M58,86 C80,66 120,66 142,86", tone: "light", stroke: 6 },
    ],
  },
];

export const HAIR_COLORS = [
  { id: "jet", name: "Jet Black", hex: "#141110" },
  { id: "espresso", name: "Espresso", hex: "#3a2318" },
  { id: "chestnut", name: "Chestnut", hex: "#6b3d21" },
  { id: "auburn", name: "Auburn", hex: "#8d3a1d" },
  { id: "caramel", name: "Caramel", hex: "#a96c30" },
  { id: "honey", name: "Honey Blonde", hex: "#cb9a54" },
  { id: "platinum", name: "Platinum", hex: "#e2d3b4" },
  { id: "silver", name: "Silver", hex: "#b6bcc3" },
  { id: "burgundy", name: "Burgundy", hex: "#6f2036" },
  { id: "cherry", name: "Cherry Red", hex: "#a8202f" },
  { id: "rose", name: "Rose Pink", hex: "#d1728f" },
  { id: "violet", name: "Violet", hex: "#6b3fa0" },
  { id: "cobalt", name: "Cobalt", hex: "#2b4fa8" },
  { id: "emerald", name: "Emerald", hex: "#1f7a5a" },
];

function hexToHsl(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function shiftLightness(hex, delta) {
  const { h, s, l } = hexToHsl(hex);
  const next = Math.min(100, Math.max(0, l + delta));
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${next.toFixed(1)}%)`;
}

export function toneSet(hex) {
  return {
    base: hex,
    light: shiftLightness(hex, 11),
    shade: shiftLightness(hex, -9),
    deep: shiftLightness(hex, -18),
  };
}

/**
 * Base shapes carry the gradient so hair reads as a rounded mass; shade and
 * light shapes are blurred washes rather than flat discs.
 */
function paintFor(shape, tones, ids) {
  if (shape.tone === "shade") {
    return `fill="${tones.deep}" opacity="0.34" filter="url(#${ids.soft})"`;
  }
  if (shape.tone === "light") {
    return `fill="${tones.light}" opacity="0.3" filter="url(#${ids.soft})"`;
  }
  return `fill="url(#${ids.grad})"`;
}

function geometry(shape, attrs = "") {
  if (shape.type === "circle") {
    return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${attrs}/>`;
  }
  if (shape.type === "ellipse") {
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" ${attrs}/>`;
  }
  if (shape.type === "rect") {
    return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.rx || 0}" ${attrs}/>`;
  }
  return `<path d="${shape.d}" ${attrs}/>`;
}

function shapeMarkup(shape, tones, ids) {
  if (shape.stroke) {
    const color = shape.tone === "light" ? tones.light : tones.deep;
    return `<path d="${shape.d}" fill="none" stroke="${color}" stroke-width="${shape.stroke}" stroke-linecap="round" opacity="0.45" filter="url(#${ids.soft})"/>`;
  }

  const paint = paintFor(shape, tones, ids);

  if (shape.type === "circle") {
    return `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" ${paint}/>`;
  }
  if (shape.type === "ellipse") {
    return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" ${paint}/>`;
  }
  if (shape.type === "rect") {
    return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.rx || 0}" ${paint}/>`;
  }
  return `<path d="${shape.d}" ${paint}/>`;
}

/**
 * Build one hairstyle as standalone SVG markup.
 * `uid` keeps mask and gradient ids unique when several render on one page.
 */
export function hairSvg(style, hex, uid) {
  const tones = toneSet(hex);
  const open = style.open || OPEN;
  const ids = {
    mask: `rx-mask-${uid}`,
    grad: `rx-grad-${uid}`,
    soft: `rx-soft-${uid}`,
    edge: `rx-edge-${uid}`,
    clip: `rx-clip-${uid}`,
    hole: `rx-hole-${uid}`,
  };

  const isSolid = (s) => !s.stroke && s.tone === "base";
  const draw = (list) => list.map((s) => shapeMarkup(s, tones, ids)).join("");

  const shapes = style.shapes || [];
  const overlay = style.overlay || [];

  const body = draw(shapes.filter(isSolid));
  const overlayBody = draw(overlay.filter(isSolid));
  const shading = draw([...shapes, ...overlay].filter((s) => !isSolid(s)));
  const clipShapes = [...shapes, ...overlay]
    .filter(isSolid)
    .map((s) => geometry(s))
    .join("");

  return `
    <defs>
      <!-- One gradient across the whole head space, so styles built from many
           shapes read as a single mass instead of separate blobs. -->
      <linearGradient id="${ids.grad}" gradientUnits="userSpaceOnUse" x1="46" y1="8" x2="166" y2="206">
        <stop offset="0%" stop-color="${tones.light}"/>
        <stop offset="34%" stop-color="${tones.base}"/>
        <stop offset="100%" stop-color="${tones.deep}"/>
      </linearGradient>
      <filter id="${ids.soft}" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
      <filter id="${ids.edge}" x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="1.4"/>
      </filter>
      <clipPath id="${ids.hole}">
        <ellipse cx="${open.cx}" cy="${open.cy}" rx="${open.rx}" ry="${open.ry}"/>
      </clipPath>
      <mask id="${ids.mask}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${VIEW.w + 80}" height="${VIEW.h + 80}">
        <rect x="-40" y="-40" width="${VIEW.w + 80}" height="${VIEW.h + 80}" fill="#fff"/>
        <ellipse cx="${open.cx}" cy="${open.cy}" rx="${open.rx}" ry="${open.ry}" fill="#000" filter="url(#${ids.edge})"/>
      </mask>
      <clipPath id="${ids.clip}">${clipShapes}</clipPath>
    </defs>
    <!-- Soft rim inside the opening reads as the hair shadowing the face. -->
    <g clip-path="url(#${ids.hole})">
      <ellipse cx="${open.cx}" cy="${open.cy}" rx="${open.rx}" ry="${open.ry}"
               fill="none" stroke="#2a1c14" stroke-width="14" opacity="0.2"
               filter="url(#${ids.soft})"/>
    </g>
    <g filter="url(#${ids.edge})">
      <g mask="url(#${ids.mask})">
        ${body}
        <g clip-path="url(#${ids.clip})">${shading}</g>
      </g>
      ${overlayBody}
    </g>
  `;
}

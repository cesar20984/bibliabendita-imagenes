import { readFile } from "node:fs/promises";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

const WIDTH = 1080;
const HEIGHT = 1350;
const SAFE_TOP = (HEIGHT - WIDTH) / 2;
const SITE_NAME = "bibliabendita.com";
let rendererAssetsPromise;

const palettes = {
  aurora: [["#193847", "#9eb7a7", "#e8cfad", "#6a8278"], ["#362e4b", "#7f718c", "#d8a999", "#efe1c4"]],
  horizon: [["#263948", "#8aa2a4", "#e2c7a2", "#f1e7d2"], ["#354b42", "#829b7f", "#d5b783", "#f0dfbd"]],
  paper: [["#d8cbb5", "#eee6d8", "#a4aa9c", "#7b8178"], ["#c9b5aa", "#eee0ce", "#9f9283", "#777169"]],
  waves: [["#183b46", "#5f8890", "#c2c6ad", "#e4c39c"], ["#34404b", "#708491", "#baa99b", "#e3d1b5"]],
  stainedGlass: [["#223e47", "#718f8b", "#c5967d", "#e5cba5"], ["#37344b", "#77718e", "#a98789", "#dec1a1"]],
  botanical: [["#1f3c35", "#5e7967", "#adb394", "#e2cfad"], ["#31443b", "#718472", "#b7aa88", "#dfc7a7"]],
  topography: [["#203d42", "#5d7d78", "#a3ad91", "#d8c4a3"], ["#30364a", "#716e83", "#aaa091", "#dfc5a6"]],
  mosaic: [["#243b43", "#5f7c80", "#a6917d", "#d9c4a5"], ["#3b3548", "#7f7182", "#ad8d80", "#ddc1a4"]],
  sunrays: [["#29414a", "#758f91", "#cfb492", "#ead6b4"], ["#41384b", "#887888", "#c49c87", "#e4c9a8"]],
  linen: [["#b7b9a8", "#d8d0bc", "#eee3cf", "#8a9184"], ["#aab6ae", "#d0d5c8", "#e9e2d3", "#7f8d88"]],
  constellations: [["#162f3c", "#345360", "#718987", "#d3bd9b"], ["#292b44", "#4f4c67", "#827887", "#d0ad96"]],
  arches: [["#264149", "#6f8b88", "#bdac91", "#e4ccb0"], ["#3b374a", "#837788", "#ba9688", "#dfc4a8"]],
  terrazzo: [["#c4c0ad", "#e4d9c5", "#758b82", "#b98570"], ["#b9c3b5", "#e1dccb", "#788d78", "#b1936e"]],
};

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}

function splitText(text, maxChars) {
  const words = text.trim().replace(/\s+/g, " ").split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function fitText(text) {
  const candidates = [
    { size: 68, maxChars: 18, maxLines: 5 },
    { size: 60, maxChars: 22, maxLines: 6 },
    { size: 52, maxChars: 26, maxLines: 7 },
    { size: 46, maxChars: 31, maxLines: 8 },
    { size: 40, maxChars: 36, maxLines: 9 },
  ];

  for (const candidate of candidates) {
    const lines = splitText(text, candidate.maxChars);
    if (lines.length <= candidate.maxLines) return { ...candidate, lines };
  }

  return { size: 36, lines: splitText(text, 42).slice(0, 9) };
}

function gradients(palette) {
  return `
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      ${palette.map((color, index) => `<stop offset="${(index / (palette.length - 1)) * 100}%" stop-color="${color}" />`).join("")}
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="74%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="100%" stop-color="#071217" stop-opacity="0.28" />
    </radialGradient>
  `;
}

function organicMotif(random, palette, isHorizon = false) {
  let svg = "";
  const count = isHorizon ? 9 : 16;
  for (let index = 0; index < count; index += 1) {
    const x = random() * WIDTH;
    const y = isHorizon ? HEIGHT * (0.45 + random() * 0.55) : random() * HEIGHT;
    const rx = (isHorizon ? 500 : 180) + random() * 520;
    const ry = (isHorizon ? 100 : 180) + random() * 390;
    svg += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${pick(random, palette)}" opacity="0.35" transform="rotate(${random() * 180} ${x} ${y})" />`;
  }
  return `<g style="mix-blend-mode:soft-light">${svg}</g>`;
}

function paperMotif(random, palette) {
  let svg = "";
  for (let index = 0; index < 90; index += 1) {
    svg += `<circle cx="${random() * WIDTH}" cy="${random() * HEIGHT}" r="${25 + random() * 180}" fill="${pick(random, palette)}" opacity="0.13" />`;
  }
  for (let index = 0; index < 115; index += 1) {
    const y = random() * HEIGHT;
    svg += `<path d="M ${random() * 130} ${y} C ${WIDTH * 0.3} ${y + random() * 12}, ${WIDTH * 0.7} ${y - random() * 12}, ${WIDTH - random() * 130} ${y}" stroke="#2c3835" stroke-opacity="0.08" fill="none" />`;
  }
  return svg;
}

function wavesMotif(random, palette) {
  let svg = "";
  for (let layer = 0; layer < 13; layer += 1) {
    const baseY = -80 + layer * 125 + random() * 90;
    const amplitude = 45 + random() * 115;
    let d = `M -100 ${baseY}`;
    for (let x = -100; x <= WIDTH + 150; x += 120) {
      const y = baseY + Math.sin(x / (120 + random() * 90) + layer) * amplitude;
      d += ` Q ${x + 60} ${y - amplitude * 0.5}, ${x + 120} ${y}`;
    }
    d += ` L ${WIDTH + 150} ${baseY + 210} L -100 ${baseY + 210} Z`;
    svg += `<path d="${d}" fill="${palette[layer % palette.length]}" opacity="${layer % 2 ? 0.26 : 0.38}" />`;
  }
  return `<g style="mix-blend-mode:soft-light">${svg}</g>`;
}

function stainedGlassMotif(random, palette) {
  let svg = "";
  const columns = 5 + Math.floor(random() * 3);
  const rows = 7 + Math.floor(random() * 3);
  const cellWidth = WIDTH / columns;
  const cellHeight = HEIGHT / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth;
      const y = row * cellHeight;
      const inset = 5 + random() * 12;
      const points = [
        `${x + inset + random() * 25},${y + inset}`,
        `${x + cellWidth - inset},${y + inset + random() * 22}`,
        `${x + cellWidth - inset - random() * 18},${y + cellHeight - inset}`,
        `${x + inset},${y + cellHeight - inset - random() * 22}`,
      ].join(" ");
      svg += `<polygon points="${points}" fill="${pick(random, palette)}" opacity="0.46" stroke="rgba(24,39,40,0.28)" stroke-width="7" />`;
    }
  }
  return svg;
}

function lineMotif(random, palette, mode) {
  let svg = "";
  if (mode === "botanical") {
    for (let stem = 0; stem < 15; stem += 1) {
      const startX = random() * WIDTH;
      const startY = HEIGHT + random() * 180;
      const endX = startX + (random() - 0.5) * 620;
      const endY = -100 + random() * 900;
      const color = pick(random, palette);
      svg += `<path d="M ${startX} ${startY} C ${startX - 130} ${startY - 380}, ${endX + 180} ${endY + 260}, ${endX} ${endY}" stroke="${color}" stroke-opacity="0.5" stroke-width="${5 + random() * 8}" stroke-linecap="round" fill="none" />`;
      for (let leaf = 1; leaf <= 7; leaf += 1) {
        const progress = leaf / 8;
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        const side = leaf % 2 === 0 ? 1 : -1;
        svg += `<ellipse cx="${x + side * 44}" cy="${y}" rx="${66 + random() * 38}" ry="${22 + random() * 18}" fill="${color}" opacity="0.32" transform="rotate(${side * (26 + random() * 26)} ${x} ${y})" />`;
      }
    }
  }
  if (mode === "topography") {
    for (let cluster = 0; cluster < 6; cluster += 1) {
      const centerX = random() * WIDTH;
      const centerY = random() * HEIGHT;
      const stretch = 0.55 + random() * 0.8;
      const color = pick(random, palette);
      for (let ring = 1; ring < 15; ring += 1) {
        let d = "";
        for (let point = 0; point <= 80; point += 1) {
          const angle = (point / 80) * Math.PI * 2;
          const radius = ring * 22 + Math.sin(angle * 3 + cluster) * 18 + Math.cos(angle * 5) * 10;
          const x = centerX + Math.cos(angle) * radius * stretch;
          const y = centerY + Math.sin(angle) * radius;
          d += `${point === 0 ? "M" : "L"} ${x} ${y} `;
        }
        svg += `<path d="${d}Z" stroke="${color}" stroke-opacity="0.34" stroke-width="2.2" fill="none" />`;
      }
    }
  }
  return `<g style="mix-blend-mode:soft-light">${svg}</g>`;
}

function shapeMotif(random, palette, mode) {
  let svg = "";
  const count = mode === "terrazzo" ? 180 : 90;
  for (let index = 0; index < count; index += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const color = pick(random, palette);
    if (mode === "constellations") {
      const nextX = x + (random() - 0.5) * 220;
      const nextY = y + (random() - 0.5) * 220;
      svg += `<line x1="${x}" y1="${y}" x2="${nextX}" y2="${nextY}" stroke="#eedebe" stroke-opacity="0.18" stroke-width="1.3" />`;
      svg += `<circle cx="${x}" cy="${y}" r="${1.5 + random() * 5}" fill="#fff4da" opacity="0.72" />`;
    } else if (mode === "arches") {
      const width = 260 + random() * 470;
      const height = 420 + random() * 650;
      const d = `M ${x} ${y + height} L ${x} ${y + width / 2} A ${width / 2} ${width / 2} 0 0 1 ${x + width} ${y + width / 2} L ${x + width} ${y + height}`;
      svg += `<path d="${d}" stroke="${color}" stroke-opacity="0.38" stroke-width="${28 + random() * 65}" fill="none" />`;
    } else if (mode === "terrazzo") {
      const sides = 3 + Math.floor(random() * 5);
      const radius = 8 + random() * 55;
      let points = "";
      for (let side = 0; side < sides; side += 1) {
        const angle = (side / sides) * Math.PI * 2;
        const pointRadius = radius * (0.65 + random() * 0.55);
        points += `${x + Math.cos(angle) * pointRadius},${y + Math.sin(angle) * pointRadius} `;
      }
      svg += `<polygon points="${points}" fill="${color}" opacity="${random() > 0.75 ? 0.5 : 0.32}" />`;
    } else {
      svg += `<circle cx="${x}" cy="${y}" r="${30 + random() * 110}" fill="${color}" opacity="0.22" />`;
    }
  }
  return svg;
}

function sunraysMotif(random, palette) {
  let svg = "";
  const originX = WIDTH * (0.2 + random() * 0.6);
  const originY = HEIGHT * (0.18 + random() * 0.64);
  for (let ray = 0; ray < 24; ray += 1) {
    const angle = (ray / 24) * Math.PI * 2;
    const spread = 0.04 + random() * 0.08;
    const length = 1300;
    const points = [
      `${originX},${originY}`,
      `${originX + Math.cos(angle - spread) * length},${originY + Math.sin(angle - spread) * length}`,
      `${originX + Math.cos(angle + spread) * length},${originY + Math.sin(angle + spread) * length}`,
    ].join(" ");
    svg += `<polygon points="${points}" fill="${palette[ray % palette.length]}" opacity="${ray % 2 ? 0.2 : 0.34}" />`;
  }
  svg += `<circle cx="${originX}" cy="${originY}" r="330" fill="#fff2d0" opacity="0.2" />`;
  return `<g style="mix-blend-mode:soft-light">${svg}</g>`;
}

function drawMotif(style, random, palette) {
  const renderers = {
    aurora: () => organicMotif(random, palette),
    horizon: () => organicMotif(random, palette, true),
    paper: () => paperMotif(random, palette),
    waves: () => wavesMotif(random, palette),
    stainedGlass: () => stainedGlassMotif(random, palette),
    botanical: () => lineMotif(random, palette, "botanical"),
    topography: () => lineMotif(random, palette, "topography"),
    mosaic: () => shapeMotif(random, palette, "mosaic"),
    sunrays: () => sunraysMotif(random, palette),
    linen: () => shapeMotif(random, palette, "linen"),
    constellations: () => shapeMotif(random, palette, "constellations"),
    arches: () => shapeMotif(random, palette, "arches"),
    terrazzo: () => shapeMotif(random, palette, "terrazzo"),
  };
  return (renderers[style] || renderers.aurora)();
}

async function ensureResvgReady() {
  if (!rendererAssetsPromise) {
    rendererAssetsPromise = Promise.all([
      readFile(new URL("../node_modules/@resvg/resvg-wasm/index_bg.wasm", import.meta.url)),
      readFile(
        new URL(
          "../node_modules/dejavu-fonts-ttf/ttf/DejaVuSerif.ttf",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf",
          import.meta.url,
        ),
      ),
    ]).then(async ([wasmBuffer, dejavuSerif, dejavuSansBold, dejavuSans]) => {
      await initWasm(wasmBuffer);
      return {
        fontBuffers: [dejavuSerif, dejavuSansBold, dejavuSans],
      };
    });
  }
  return rendererAssetsPromise;
}

function createSvg({ text, reference, style, seed }) {
  const styleNames = Object.keys(palettes);
  const random = createRandom(seed);
  const selectedStyle = styleNames.includes(style) ? style : pick(random, styleNames);
  const palette = pick(random, palettes[selectedStyle]);
  const backgroundBrightness = palette.reduce((sum, color) => sum + luminance(color), 0) / palette.length;
  const useLightText = backgroundBrightness < 0.58;
  const textColor = useLightText ? "#fffaf0" : "#182321";
  const mutedTextColor = useLightText ? "rgba(255,250,240,0.78)" : "rgba(24,35,33,0.72)";
  const panelRgb = useLightText ? "16,30,31" : "247,239,222";
  const fitted = fitText(text);
  const lineHeight = fitted.size * 1.16;
  const messageHeight = fitted.lines.length * lineHeight;
  const panelWidth = 810;
  const panelX = (WIDTH - panelWidth) / 2;
  const panelHeight = Math.max(420, messageHeight + 225);
  const panelY = Math.min(pick(random, [SAFE_TOP + 115, SAFE_TOP + 245, SAFE_TOP + 365]), SAFE_TOP + WIDTH - panelHeight - 75);
  const textX = panelX + 60;
  const brandY = random() > 0.5 ? SAFE_TOP + 62 : SAFE_TOP + WIDTH - 54;
  const messageLines = fitted.lines
    .map((line, index) => `<tspan x="${textX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>${gradients(palette)}</defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
      ${drawMotif(selectedStyle, random, palette)}
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#vignette)" />
      <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="36" fill="rgba(${panelRgb},${useLightText ? 0.54 : 0.72})" />
      <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="36" fill="#ffffff" opacity="0.05" />
      <text x="${textX}" y="${panelY + 68}" fill="${mutedTextColor}" font-family="'DejaVu Sans'" font-size="20" font-weight="700" letter-spacing="3">UNA PALABRA PARA HOY</text>
      <text x="${textX}" y="${panelY + 136}" fill="${textColor}" font-family="'DejaVu Serif'" font-size="${fitted.size}">${messageLines}</text>
      <line x1="${textX}" y1="${panelY + 136 + messageHeight + 28}" x2="${textX + 52}" y2="${panelY + 136 + messageHeight + 28}" stroke="${mutedTextColor}" stroke-width="2" />
      <text x="${textX + 72}" y="${panelY + 136 + messageHeight + 36}" fill="${textColor}" font-family="'DejaVu Sans'" font-size="25" font-weight="700">${escapeXml(reference)}</text>
      <text x="${WIDTH / 2}" y="${brandY}" text-anchor="middle" fill="${useLightText ? "#fffaf0" : "#182321"}" opacity="0.9" font-family="'DejaVu Sans'" font-size="34" font-weight="700" letter-spacing="1.5">${SITE_NAME}</text>
    </svg>
  `;
}

export async function generatePostPng(options = {}) {
  const { fontBuffers } = await ensureResvgReady();
  const text = String(options.text || "Incluso cuando el camino no está claro, la fe nos recuerda que nunca avanzamos solos.").slice(0, 260);
  const reference = String(options.reference || "Salmos 32:8").slice(0, 80);
  const seed = String(options.seed || `${Date.now()}-${Math.random()}`);
  const style = options.style ? String(options.style) : undefined;
  const svg = createSvg({ text, reference, seed, style });
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: WIDTH,
    },
      font: {
        fontBuffers,
        loadSystemFonts: false,
        defaultFontFamily: "DejaVu Sans",
        sansSerifFamily: "DejaVu Sans",
        serifFamily: "DejaVu Serif",
      },
    });
  return resvg.render().asPng();
}

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({
      ok: true,
      endpoint: "POST /api/generate",
      body: { text: "string", reference: "string", style: "optional", seed: "optional" },
      styles: Object.keys(palettes),
    });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const png = await generatePostPng(getBody(req));
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", 'inline; filename="bibliabendita.png"');
    res.status(200).send(png);
  } catch (error) {
    res.status(500).json({ error: "Could not generate image", detail: error.message });
  }
}

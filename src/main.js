import "./styles.css";

const canvas = document.querySelector("#post-canvas");
const ctx = canvas.getContext("2d");
const form = document.querySelector("#composer-form");
const messageInput = document.querySelector("#message");
const referenceInput = document.querySelector("#reference");
const characterCount = document.querySelector("#character-count");
const generateButton = document.querySelector("#generate-button");
const downloadButton = document.querySelector("#download-button");

const WIDTH = 1080;
const HEIGHT = 1350;
const SAFE_TOP = (HEIGHT - WIDTH) / 2;
const SITE_NAME = "bibliabendita.com";

let activeStyle = "aurora";
let activeSeed = createSeed();
let renderQueued = false;

const palettes = {
  aurora: [
    ["#193847", "#9eb7a7", "#e8cfad", "#6a8278"],
    ["#362e4b", "#7f718c", "#d8a999", "#efe1c4"],
    ["#173d3a", "#5f8a7b", "#d8c6a2", "#cc8268"],
    ["#25334c", "#637b9a", "#d6b99d", "#8f675c"],
  ],
  horizon: [
    ["#263948", "#8aa2a4", "#e2c7a2", "#f1e7d2"],
    ["#263246", "#81778a", "#cf9e85", "#f0cfaa"],
    ["#354b42", "#829b7f", "#d5b783", "#f0dfbd"],
    ["#253b4d", "#718fa3", "#c7a48b", "#ead8bd"],
  ],
  paper: [
    ["#d8cbb5", "#eee6d8", "#a4aa9c", "#7b8178"],
    ["#d6bfa8", "#f1e7d8", "#9a8d84", "#6f7d79"],
    ["#c3c8b9", "#e9e2cf", "#879187", "#6a746f"],
    ["#c9b5aa", "#eee0ce", "#9f9283", "#777169"],
  ],
  waves: [
    ["#183b46", "#5f8890", "#c2c6ad", "#e4c39c"],
    ["#2f3550", "#7d7895", "#c9a8a0", "#ead8bf"],
    ["#23443f", "#6c9182", "#b7bd97", "#e2c49a"],
    ["#34404b", "#708491", "#baa99b", "#e3d1b5"],
  ],
  stainedGlass: [
    ["#223e47", "#718f8b", "#c5967d", "#e5cba5"],
    ["#37344b", "#77718e", "#a98789", "#dec1a1"],
    ["#24443d", "#718b70", "#ae9c73", "#d8b99a"],
    ["#303f50", "#6e8290", "#a87b72", "#d8bca1"],
  ],
  botanical: [
    ["#1f3c35", "#5e7967", "#adb394", "#e2cfad"],
    ["#31443b", "#718472", "#b7aa88", "#dfc7a7"],
    ["#233d43", "#66807a", "#a0aa91", "#d8c3a5"],
    ["#3d3c45", "#77716f", "#a69c83", "#dbc2a2"],
  ],
  topography: [
    ["#203d42", "#5d7d78", "#a3ad91", "#d8c4a3"],
    ["#30364a", "#716e83", "#aaa091", "#dfc5a6"],
    ["#2d443b", "#73866c", "#b2aa83", "#dec397"],
    ["#34424b", "#75858a", "#aca090", "#dbc5ac"],
  ],
  mosaic: [
    ["#243b43", "#5f7c80", "#a6917d", "#d9c4a5"],
    ["#3b3548", "#7f7182", "#ad8d80", "#ddc1a4"],
    ["#244239", "#6f876d", "#a5a17f", "#d7bc98"],
    ["#2e4050", "#708492", "#a68579", "#d8bda5"],
  ],
  sunrays: [
    ["#29414a", "#758f91", "#cfb492", "#ead6b4"],
    ["#41384b", "#887888", "#c49c87", "#e4c9a8"],
    ["#30473e", "#829176", "#c4ad80", "#e6cc9f"],
    ["#344452", "#7c8b95", "#c4aa97", "#e7d2b6"],
  ],
  linen: [
    ["#b7b9a8", "#d8d0bc", "#eee3cf", "#8a9184"],
    ["#bba99f", "#dacbbc", "#eee0cc", "#91847e"],
    ["#aab6ae", "#d0d5c8", "#e9e2d3", "#7f8d88"],
    ["#b6afa4", "#d7cbbc", "#eadbc7", "#8b837a"],
  ],
  constellations: [
    ["#162f3c", "#345360", "#718987", "#d3bd9b"],
    ["#292b44", "#4f4c67", "#827887", "#d0ad96"],
    ["#183833", "#3d5f56", "#71887a", "#cfb58f"],
    ["#273647", "#485b6d", "#788694", "#d2b7a0"],
  ],
  arches: [
    ["#264149", "#6f8b88", "#bdac91", "#e4ccb0"],
    ["#3b374a", "#837788", "#ba9688", "#dfc4a8"],
    ["#2b443c", "#74876e", "#b4a179", "#ddc097"],
    ["#334550", "#788a91", "#b09b8b", "#dfc8ae"],
  ],
  terrazzo: [
    ["#c4c0ad", "#e4d9c5", "#758b82", "#b98570"],
    ["#c8b8ae", "#e8dcc9", "#82798b", "#aa7e76"],
    ["#b9c3b5", "#e1dccb", "#788d78", "#b1936e"],
    ["#b9bdba", "#dfd7c9", "#758692", "#a87f72"],
  ],
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

function createSeed() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function randomizeComposition() {
  const styles = Object.keys(palettes);
  const requestedStyle = new URLSearchParams(window.location.search).get("style");
  activeStyle = styles.includes(requestedStyle)
    ? requestedStyle
    : styles[Math.floor(Math.random() * styles.length)];
  activeSeed = createSeed();
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function roundedRect(context, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, corner);
}

function drawBackground(random, palette) {
  const gradient = ctx.createLinearGradient(
    random() * WIDTH,
    0,
    WIDTH * (0.4 + random() * 0.6),
    HEIGHT,
  );
  palette.forEach((color, index) => {
    gradient.addColorStop(index / (palette.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const renderers = {
    paper: drawPaperTexture,
    waves: drawWaves,
    stainedGlass: drawStainedGlass,
    botanical: drawBotanical,
    topography: drawTopography,
    mosaic: drawMosaic,
    sunrays: drawSunrays,
    linen: drawLinen,
    constellations: drawConstellations,
    arches: drawArches,
    terrazzo: drawTerrazzo,
  };

  const renderer = renderers[activeStyle];
  if (renderer) {
    renderer(random, palette);
  } else {
    drawOrganicLayers(random, palette, activeStyle === "horizon");
  }

  const vignette = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    200,
    WIDTH / 2,
    HEIGHT / 2,
    850,
  );
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(7,18,23,0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawOrganicLayers(random, palette, isHorizon) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";

  const layerCount = isHorizon ? 9 : 16;
  for (let index = 0; index < layerCount; index += 1) {
    const x = random() * WIDTH;
    const y = isHorizon
      ? HEIGHT * (0.45 + random() * 0.55)
      : random() * HEIGHT;
    const radiusX = (isHorizon ? 500 : 180) + random() * 520;
    const radiusY = (isHorizon ? 100 : 180) + random() * 390;
    const color = palette[Math.floor(random() * palette.length)];
    const blob = ctx.createRadialGradient(x, y, 10, x, y, radiusX);
    blob.addColorStop(0, `${color}d9`);
    blob.addColorStop(0.55, `${color}70`);
    blob.addColorStop(1, `${color}00`);
    ctx.fillStyle = blob;
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < 6; index += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 110 + random() * 280);
    glow.addColorStop(0, `rgba(255, 238, 209, ${0.08 + random() * 0.12})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function drawPaperTexture(random, palette) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let index = 0; index < 85; index += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const size = 25 + random() * 180;
    ctx.fillStyle = palette[Math.floor(random() * palette.length)];
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#2c3835";
  ctx.lineWidth = 1;
  for (let index = 0; index < 160; index += 1) {
    const y = random() * HEIGHT;
    ctx.beginPath();
    ctx.moveTo(random() * 130, y);
    ctx.bezierCurveTo(
      WIDTH * 0.3,
      y + random() * 12,
      WIDTH * 0.7,
      y - random() * 12,
      WIDTH - random() * 130,
      y,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaves(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  for (let layer = 0; layer < 13; layer += 1) {
    const baseY = -80 + layer * 125 + random() * 90;
    const amplitude = 45 + random() * 115;
    const color = palette[layer % palette.length];
    ctx.beginPath();
    ctx.moveTo(-100, baseY);
    for (let x = -100; x <= WIDTH + 150; x += 120) {
      const y = baseY + Math.sin(x / (120 + random() * 90) + layer) * amplitude;
      ctx.quadraticCurveTo(x + 60, y - amplitude * 0.5, x + 120, y);
    }
    ctx.lineTo(WIDTH + 150, baseY + 210);
    ctx.lineTo(-100, baseY + 210);
    ctx.closePath();
    ctx.fillStyle = `${color}${layer % 2 ? "54" : "72"}`;
    ctx.fill();
  }
  ctx.restore();
}

function drawStainedGlass(random, palette) {
  const columns = 5 + Math.floor(random() * 3);
  const rows = 7 + Math.floor(random() * 3);
  const cellWidth = WIDTH / columns;
  const cellHeight = HEIGHT / rows;

  ctx.save();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(24, 39, 40, 0.28)";
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * cellWidth;
      const y = row * cellHeight;
      const inset = 5 + random() * 12;
      ctx.beginPath();
      ctx.moveTo(x + inset + random() * 25, y + inset);
      ctx.lineTo(x + cellWidth - inset, y + inset + random() * 22);
      ctx.lineTo(x + cellWidth - inset - random() * 18, y + cellHeight - inset);
      ctx.lineTo(x + inset, y + cellHeight - inset - random() * 22);
      ctx.closePath();
      ctx.fillStyle = `${palette[Math.floor(random() * palette.length)]}8f`;
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255, 241, 211, 0.12)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function drawBotanical(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.lineCap = "round";

  for (let stem = 0; stem < 15; stem += 1) {
    const startX = random() * WIDTH;
    const startY = HEIGHT + random() * 180;
    const endX = startX + (random() - 0.5) * 620;
    const endY = -100 + random() * 900;
    const color = palette[Math.floor(random() * palette.length)];
    ctx.strokeStyle = `${color}a8`;
    ctx.fillStyle = `${color}78`;
    ctx.lineWidth = 5 + random() * 8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(startX - 130, startY - 380, endX + 180, endY + 260, endX, endY);
    ctx.stroke();

    const leaves = 5 + Math.floor(random() * 5);
    for (let leaf = 1; leaf <= leaves; leaf += 1) {
      const progress = leaf / (leaves + 1);
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      const side = leaf % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side * (0.45 + random() * 0.45));
      ctx.beginPath();
      ctx.ellipse(side * 44, 0, 66 + random() * 38, 22 + random() * 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawTopography(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.lineWidth = 2.2;

  for (let cluster = 0; cluster < 6; cluster += 1) {
    const centerX = random() * WIDTH;
    const centerY = random() * HEIGHT;
    const stretch = 0.55 + random() * 0.8;
    ctx.strokeStyle = `${palette[Math.floor(random() * palette.length)]}b8`;
    for (let ring = 1; ring < 15; ring += 1) {
      ctx.beginPath();
      const points = 80;
      for (let point = 0; point <= points; point += 1) {
        const angle = (point / points) * Math.PI * 2;
        const wobble = Math.sin(angle * 3 + cluster) * 18 + Math.cos(angle * 5) * 10;
        const radius = ring * 22 + wobble;
        const x = centerX + Math.cos(angle) * radius * stretch;
        const y = centerY + Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawMosaic(random, palette) {
  const tileSize = 105 + Math.floor(random() * 45);
  ctx.save();
  ctx.translate(-tileSize, -tileSize);
  ctx.rotate((random() - 0.5) * 0.15);
  ctx.globalCompositeOperation = "soft-light";

  for (let y = 0; y < HEIGHT + tileSize * 3; y += tileSize) {
    for (let x = 0; x < WIDTH + tileSize * 3; x += tileSize) {
      const offset = (Math.floor(y / tileSize) % 2) * (tileSize / 2);
      ctx.fillStyle = `${palette[Math.floor(random() * palette.length)]}${random() > 0.5 ? "75" : "98"}`;
      ctx.beginPath();
      if (random() > 0.45) {
        ctx.arc(x + offset, y, tileSize * 0.42, 0, Math.PI * 2);
      } else {
        roundedRect(ctx, x + offset - tileSize * 0.4, y - tileSize * 0.4, tileSize * 0.8, tileSize * 0.8, 18);
      }
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawSunrays(random, palette) {
  const originX = WIDTH * (0.2 + random() * 0.6);
  const originY = HEIGHT * (0.18 + random() * 0.64);
  const rayCount = 18 + Math.floor(random() * 10);
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";

  for (let ray = 0; ray < rayCount; ray += 1) {
    const angle = (ray / rayCount) * Math.PI * 2;
    const spread = 0.04 + random() * 0.08;
    const length = 1300;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + Math.cos(angle - spread) * length, originY + Math.sin(angle - spread) * length);
    ctx.lineTo(originX + Math.cos(angle + spread) * length, originY + Math.sin(angle + spread) * length);
    ctx.closePath();
    ctx.fillStyle = `${palette[ray % palette.length]}${ray % 2 ? "42" : "68"}`;
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(originX, originY, 0, originX, originY, 330);
  glow.addColorStop(0, "rgba(255,242,208,0.52)");
  glow.addColorStop(1, "rgba(255,242,208,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

function drawLinen(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.lineWidth = 1;

  for (let x = 0; x < WIDTH; x += 5) {
    ctx.strokeStyle = `${palette[Math.floor(random() * palette.length)]}20`;
    ctx.beginPath();
    ctx.moveTo(x + random() * 2, 0);
    ctx.lineTo(x + (random() - 0.5) * 8, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 5) {
    ctx.strokeStyle = `${palette[Math.floor(random() * palette.length)]}1d`;
    ctx.beginPath();
    ctx.moveTo(0, y + random() * 2);
    ctx.lineTo(WIDTH, y + (random() - 0.5) * 8);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.16;
  for (let patch = 0; patch < 12; patch += 1) {
    ctx.fillStyle = palette[Math.floor(random() * palette.length)];
    ctx.beginPath();
    ctx.ellipse(random() * WIDTH, random() * HEIGHT, 130 + random() * 290, 90 + random() * 240, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawConstellations(random, palette) {
  const stars = Array.from({ length: 75 }, () => ({
    x: random() * WIDTH,
    y: random() * HEIGHT,
    radius: 1.5 + random() * 5,
  }));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(238, 222, 190, 0.22)";
  ctx.lineWidth = 1.5;
  for (let index = 0; index < stars.length - 1; index += 1) {
    const star = stars[index];
    const next = stars[index + 1];
    const distance = Math.hypot(star.x - next.x, star.y - next.y);
    if (distance < 230) {
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
  }

  stars.forEach((star, index) => {
    ctx.fillStyle = index % 5 === 0 ? palette[3] : "rgba(255,244,218,0.72)";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawArches(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const archCount = 7 + Math.floor(random() * 5);

  for (let arch = 0; arch < archCount; arch += 1) {
    const width = 260 + random() * 470;
    const height = 420 + random() * 650;
    const x = -100 + random() * (WIDTH + 200 - width);
    const y = random() * HEIGHT;
    ctx.lineWidth = 28 + random() * 65;
    ctx.strokeStyle = `${palette[arch % palette.length]}83`;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x, y + width / 2);
    ctx.arc(x + width / 2, y + width / 2, width / 2, Math.PI, 0);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTerrazzo(random, palette) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  for (let chip = 0; chip < 180; chip += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const radius = 8 + random() * 55;
    const sides = 3 + Math.floor(random() * 5);
    ctx.fillStyle = `${palette[Math.floor(random() * palette.length)]}${random() > 0.75 ? "9c" : "64"}`;
    ctx.beginPath();
    for (let side = 0; side < sides; side += 1) {
      const angle = (side / sides) * Math.PI * 2;
      const pointRadius = radius * (0.65 + random() * 0.55);
      const px = x + Math.cos(angle) * pointRadius;
      const py = y + Math.sin(angle) * pointRadius;
      if (side === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function wrapText(text, maxWidth, font) {
  ctx.font = font;
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });

  if (line) lines.push(line);
  return lines;
}

function fitMessage(text, maxWidth, maxLines) {
  let fontSize = 72;
  let lines = [];
  while (fontSize >= 38) {
    lines = wrapText(text, maxWidth, `${fontSize}px "Libre Caslon Display"`);
    if (lines.length <= maxLines) break;
    fontSize -= 3;
  }
  return { fontSize, lines };
}

function drawComposition(random, palette) {
  const backgroundBrightness =
    palette.reduce((sum, color) => sum + luminance(color), 0) / palette.length;
  const useLightText = backgroundBrightness < 0.58;
  const textColor = useLightText ? "#fffaf0" : "#182321";
  const mutedTextColor = useLightText
    ? "rgba(255,250,240,0.78)"
    : "rgba(24,35,33,0.72)";
  const panelColor = useLightText
    ? `rgba(16, 30, 31, ${0.46 + random() * 0.12})`
    : `rgba(247, 239, 222, ${0.64 + random() * 0.12})`;

  const contentWidth = 810;
  const contentX = (WIDTH - contentWidth) / 2;
  const placementOptions = [SAFE_TOP + 115, SAFE_TOP + 245, SAFE_TOP + 365];
  const panelY = placementOptions[Math.floor(random() * placementOptions.length)];
  const fitted = fitMessage(messageInput.value || "Una palabra de esperanza para hoy.", 690, 7);
  const lineHeight = fitted.fontSize * 1.16;
  const messageHeight = fitted.lines.length * lineHeight;
  const panelHeight = Math.max(420, messageHeight + 225);
  const safePanelY = Math.min(panelY, SAFE_TOP + WIDTH - panelHeight - 75);

  ctx.save();
  ctx.shadowColor = "rgba(9, 18, 19, 0.17)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = panelColor;
  roundedRect(ctx, contentX, safePanelY, contentWidth, panelHeight, 36);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundedRect(ctx, contentX, safePanelY, contentWidth, panelHeight, 36);
  ctx.clip();
  const panelSheen = ctx.createLinearGradient(contentX, safePanelY, contentX + contentWidth, safePanelY + panelHeight);
  panelSheen.addColorStop(0, "rgba(255,255,255,0.08)");
  panelSheen.addColorStop(0.5, "rgba(255,255,255,0)");
  panelSheen.addColorStop(1, "rgba(255,255,255,0.05)");
  ctx.fillStyle = panelSheen;
  ctx.fillRect(contentX, safePanelY, contentWidth, panelHeight);
  ctx.restore();

  const textX = contentX + 60;
  let currentY = safePanelY + 68;

  ctx.fillStyle = mutedTextColor;
  ctx.font = '600 20px "DM Sans"';
  ctx.letterSpacing = "3px";
  ctx.fillText("UNA PALABRA PARA HOY", textX, currentY);
  ctx.letterSpacing = "0px";

  currentY += 68;
  ctx.fillStyle = textColor;
  ctx.font = `${fitted.fontSize}px "Libre Caslon Display"`;
  fitted.lines.forEach((line) => {
    ctx.fillText(line, textX, currentY);
    currentY += lineHeight;
  });

  currentY += 28;
  ctx.strokeStyle = mutedTextColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, currentY);
  ctx.lineTo(textX + 52, currentY);
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = '600 25px "DM Sans"';
  ctx.fillText(referenceInput.value || "Salmos 32:8", textX + 72, currentY + 8);

  const brandAtTop = random() > 0.5;
  const brandY = brandAtTop ? SAFE_TOP + 62 : SAFE_TOP + WIDTH - 54;
  ctx.fillStyle = useLightText ? "rgba(255,250,240,0.9)" : "rgba(24,35,33,0.86)";
  ctx.font = '700 34px "DM Sans"';
  ctx.textAlign = "center";
  ctx.letterSpacing = "1.5px";
  ctx.fillText(SITE_NAME, WIDTH / 2, brandY);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "start";
}

function render() {
  const random = createRandom(`${activeSeed}-${activeStyle}`);
  const options = palettes[activeStyle];
  const palette = options[Math.floor(random() * options.length)];
  canvas.dataset.style = activeStyle;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawBackground(random, palette);
  drawComposition(random, palette);
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  window.requestAnimationFrame(() => {
    render();
    renderQueued = false;
  });
}

messageInput.addEventListener("input", () => {
  characterCount.textContent = messageInput.value.length;
  queueRender();
});

form.addEventListener("input", queueRender);

generateButton.addEventListener("click", () => {
  randomizeComposition();
  render();
  generateButton.animate(
    [
      { transform: "translateY(0)" },
      { transform: "translateY(-2px)" },
      { transform: "translateY(0)" },
    ],
    { duration: 220 },
  );
});

downloadButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `bibliabendita-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.fonts.ready.then(() => {
  randomizeComposition();
  render();
});

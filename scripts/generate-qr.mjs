import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const rootDir    = path.resolve(__dirname, "..");

// ── Env helpers ──────────────────────────────────────────────────────
function parseEnv(raw) {
  const map = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val   = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    map[key] = val;
  }
  return map;
}
function normalizeUrl(v) {
  if (!v) return "";
  return v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`;
}
async function loadEnvFile() {
  try { return parseEnv(await fs.readFile(path.join(rootDir, ".env"), "utf8")); }
  catch { return {}; }
}

// ── Hybrid styled canvas ─────────────────────────────────────────────
const MARGIN = 80;
const QR_SZ  = 720;
const W      = QR_SZ + MARGIN * 2;
const H      = W;
const CX     = W / 2;
const CY     = H / 2;
const CARD_PAD = 54;
const CARD_X   = CARD_PAD;
const CARD_Y   = CARD_PAD;
const CARD_W   = W - CARD_PAD * 2;
const CARD_H   = H - CARD_PAD * 2;
const CARD_RX  = 42;
const QR_DRAW  = 648;
const QR_X     = (W - QR_DRAW) / 2;
const QR_Y     = (H - QR_DRAW) / 2;

// ── Middle finger icon (fa6-solid hand-middle-finger) ────────────────
const HAND_PATH = "M232 0c-22.1 0-40 17.9-40 40v164.2c-8.5-7.6-19.7-12.2-32-12.2c-26.5 0-48 21.5-48 48v80c0 8.8-7.2 16-16 16s-16-7.2-16-16v-55.7c-2 1.4-3.9 3-5.8 4.5l-19.2 16C40.4 297 32 315 32 334v38c0 38 16.9 74 46.1 98.3l5.4 4.5c28.8 24 65 37.1 102.4 37.1l118.1.1c70.7 0 128-57.3 128-128v-96c0-26.5-21.5-48-48-48c-12.4 0-23.6 4.7-32.1 12.3C350 227.5 329.3 208 304 208c-12.3 0-23.5 4.6-32 12.2V40c0-22.1-17.9-40-40-40";
// Original viewBox: 448 × 512
const HAND_VB_W = 448, HAND_VB_H = 512;

// Large background hand outline that stays OUTSIDE the QR matrix.
const BG_HAND_H  = 820;
const BG_HAND_W  = BG_HAND_H * (HAND_VB_W / HAND_VB_H);
const BG_HAND_X  = CX - BG_HAND_W / 2;
const BG_HAND_Y  = CY - BG_HAND_H / 2 + 12;
const BG_HAND_SX = BG_HAND_W / HAND_VB_W;
const BG_HAND_SY = BG_HAND_H / HAND_VB_H;

async function buildScanSafeSVG(url, width = 2048) {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 8,
    width,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

async function buildScanSafePNG(url, width = 3200) {
  return QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "H",
    margin: 8,
    width,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

function toDataUri(mime, content) {
  return `data:${mime};base64,${Buffer.from(content).toString("base64")}`;
}

const HYBRID_SIDE = 3600;
const HYBRID_QR_SIDE = 3200;
const HYBRID_QR_POS = 200;
const HYBRID_SHELL_INSET = 82;
const HYBRID_FRAME_INSET = 148;
const HYBRID_FRAME_SIZE = HYBRID_SIDE - HYBRID_FRAME_INSET * 2;
const HYBRID_CORNER_INSET = 112;
const HYBRID_CORNER_LEN = 328;
const HYBRID_CORNER_THICK = 34;
const HYBRID_NOTCH_LEN = 220;
const HYBRID_NOTCH_THICK = 24;

function buildCornerBracketSVG(anchorX, anchorY, horizontalDir, verticalDir) {
  const thickness = HYBRID_CORNER_THICK;
  const radius = thickness / 2;
  const horizontalX = horizontalDir > 0 ? anchorX : anchorX - HYBRID_CORNER_LEN;
  const verticalY = verticalDir > 0 ? anchorY : anchorY - HYBRID_CORNER_LEN;

  return [
    `<rect x="${horizontalX}" y="${anchorY - thickness / 2}" width="${HYBRID_CORNER_LEN}" height="${thickness}" rx="${radius}" fill="url(#frame-accent)"/>`,
    `<rect x="${anchorX - thickness / 2}" y="${verticalY}" width="${thickness}" height="${HYBRID_CORNER_LEN}" rx="${radius}" fill="url(#frame-accent)"/>`,
  ].join("\n    ");
}

function buildEdgeNotchSVG(x, y, width, height) {
  const radius = Math.min(width, height) / 2;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="url(#frame-accent)" opacity="0.95"/>`;
}

function buildHybridCanvasSVG(qrHref, qrBoxSize) {
  const qrX = HYBRID_QR_POS;
  const qrY = HYBRID_QR_POS;
  const qrOuter = HYBRID_QR_POS + HYBRID_QR_SIDE;
  const shellSize = HYBRID_SIDE - HYBRID_SHELL_INSET * 2;
  const topNotchX = (HYBRID_SIDE - HYBRID_NOTCH_LEN) / 2;
  const sideNotchY = (HYBRID_SIDE - HYBRID_NOTCH_LEN) / 2;
  const cornerBrackets = [
    buildCornerBracketSVG(HYBRID_CORNER_INSET, HYBRID_CORNER_INSET, 1, 1),
    buildCornerBracketSVG(HYBRID_SIDE - HYBRID_CORNER_INSET, HYBRID_CORNER_INSET, -1, 1),
    buildCornerBracketSVG(HYBRID_CORNER_INSET, HYBRID_SIDE - HYBRID_CORNER_INSET, 1, -1),
    buildCornerBracketSVG(HYBRID_SIDE - HYBRID_CORNER_INSET, HYBRID_SIDE - HYBRID_CORNER_INSET, -1, -1),
  ].join("\n    ");
  const edgeNotches = [
    buildEdgeNotchSVG(topNotchX, 110, HYBRID_NOTCH_LEN, HYBRID_NOTCH_THICK),
    buildEdgeNotchSVG(topNotchX, HYBRID_SIDE - 110 - HYBRID_NOTCH_THICK, HYBRID_NOTCH_LEN, HYBRID_NOTCH_THICK),
    buildEdgeNotchSVG(110, sideNotchY, HYBRID_NOTCH_THICK, HYBRID_NOTCH_LEN),
    buildEdgeNotchSVG(HYBRID_SIDE - 110 - HYBRID_NOTCH_THICK, sideNotchY, HYBRID_NOTCH_THICK, HYBRID_NOTCH_LEN),
  ].join("\n    ");
  const imageMarkup = qrHref
    ? `<image href="${qrHref}" x="${qrX}" y="${qrY}" width="${qrBoxSize}" height="${qrBoxSize}" preserveAspectRatio="none"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${HYBRID_SIDE}" height="${HYBRID_SIDE}" viewBox="0 0 ${HYBRID_SIDE} ${HYBRID_SIDE}">
  <defs>
    <radialGradient id="bg-bloom" cx="50%" cy="44%" r="62%">
      <stop offset="0%" stop-color="#2a0505"/>
      <stop offset="45%" stop-color="#130202"/>
      <stop offset="100%" stop-color="#050505"/>
    </radialGradient>
    <linearGradient id="frame-accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff6767"/>
      <stop offset="40%" stop-color="#e12121"/>
      <stop offset="100%" stop-color="#8d0909"/>
    </linearGradient>
    <linearGradient id="hand-accent" x1="0%" y1="10%" x2="100%" y2="90%">
      <stop offset="0%" stop-color="#ff5f5f"/>
      <stop offset="60%" stop-color="#dc1f1f"/>
      <stop offset="100%" stop-color="#840707"/>
    </linearGradient>
    <filter id="frame-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.45 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="hand-aura" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="34" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="1 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0.40 0"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="${HYBRID_SIDE}" height="${HYBRID_SIDE}" fill="#050505"/>
  <rect width="${HYBRID_SIDE}" height="${HYBRID_SIDE}" fill="url(#bg-bloom)"/>
  <ellipse cx="620" cy="620" rx="540" ry="400" fill="#b20f0f" opacity="0.14"/>
  <ellipse cx="3020" cy="3020" rx="560" ry="420" fill="#b20f0f" opacity="0.14"/>

  <path d="${HAND_PATH}" fill="none" stroke="#5d0505" stroke-width="34" opacity="0.75"
        filter="url(#hand-aura)"
        transform="translate(365 250) scale(5.7)"/>
  <path d="${HAND_PATH}" fill="none" stroke="url(#hand-accent)" stroke-width="20"
        stroke-linecap="round" stroke-linejoin="round"
        transform="translate(365 250) scale(5.7)"/>

  <rect x="${HYBRID_SHELL_INSET}" y="${HYBRID_SHELL_INSET}" width="${shellSize}" height="${shellSize}" rx="88"
        fill="none" stroke="#4d0808" stroke-width="12" opacity="0.9"/>
  <rect x="${HYBRID_FRAME_INSET}" y="${HYBRID_FRAME_INSET}" width="${HYBRID_FRAME_SIZE}" height="${HYBRID_FRAME_SIZE}" rx="54"
        fill="none" stroke="#761010" stroke-width="10" opacity="0.9"/>
  <g filter="url(#frame-glow)">
    <rect x="180" y="180" width="3240" height="3240" rx="38" fill="none" stroke="url(#frame-accent)" stroke-width="16"/>
    <rect x="162" y="162" width="3276" height="3276" rx="50" fill="none" stroke="#ff8f8f" stroke-opacity="0.22" stroke-width="4"/>
    ${cornerBrackets}
    ${edgeNotches}
  </g>

  <rect x="${qrX}" y="${qrY}" width="${qrBoxSize}" height="${qrBoxSize}" rx="18"
        fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="4"/>
    <path d="M${HYBRID_SHELL_INSET} ${HYBRID_SIDE / 2} H${qrX - 54} M${qrOuter + 54} ${HYBRID_SIDE / 2} H${HYBRID_SIDE - HYBRID_SHELL_INSET}"
        stroke="#ff6b6b" stroke-opacity="0.52" stroke-width="6" stroke-linecap="round"/>
    <path d="M${HYBRID_SIDE / 2} ${HYBRID_SHELL_INSET} V${qrY - 54} M${HYBRID_SIDE / 2} ${qrOuter + 54} V${HYBRID_SIDE - HYBRID_SHELL_INSET}"
        stroke="#ff6b6b" stroke-opacity="0.52" stroke-width="6" stroke-linecap="round"/>

  ${imageMarkup}
</svg>`;
}

function buildHybridSVG(url, { forPng = false } = {}) {
  // Raw QR data matrix (error-correction H = 30% recovery)
  const qr    = QRCode.create(url, { errorCorrectionLevel: "H" });
  const mods  = qr.modules;
  const count = mods.size;
  const ms    = QR_DRAW / count;
  const blackInset = 0;
  const blackSize = ms.toFixed(2);
  const blackRx = "0";

  const qrRects = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (mods.data[row * count + col] === 1) {
        const baseX = QR_X + col * ms;
        const baseY = QR_Y + row * ms;
        qrRects.push(
          `<rect x="${(baseX + blackInset).toFixed(2)}" y="${(baseY + blackInset).toFixed(2)}" width="${blackSize}" height="${blackSize}" rx="${blackRx}" fill="#000000"/>`,
        );
      }
    }
  }

  const glowMarkup = forPng ? "" : `
  <filter id="card-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="14" result="blur"/>
    <feColorMatrix in="blur" type="matrix"
      values="1 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0.35 0"/>
    <feMerge>
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
  <filter id="hand-glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="8" result="blur"/>
    <feColorMatrix in="blur" type="matrix"
      values="1 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0.32 0"/>
    <feMerge>
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${glowMarkup}
  </defs>

  <!-- 1. Background -->
  <rect width="${W}" height="${H}" fill="#060606"/>

  <!-- 2. Large middle-finger outline in the background layer -->
  <path d="${HAND_PATH}" fill="none" stroke="#d81e1e"
        stroke-width="${(8 / BG_HAND_SX).toFixed(1)}"
        transform="translate(${BG_HAND_X.toFixed(1)},${BG_HAND_Y.toFixed(1)}) scale(${BG_HAND_SX.toFixed(4)},${BG_HAND_SY.toFixed(4)})"
        ${forPng ? "" : 'filter="url(#hand-glow)"'}/>

  <!-- 3. White panel keeps the QR scanner-friendly while the outer canvas stays dark -->
  <rect x="${CARD_X}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="${CARD_RX}"
        fill="#ffffff" stroke="#cf2020" stroke-width="4"${forPng ? "" : ' filter="url(#card-glow)"'}/>

  <!-- 4. Standard black QR for reliable file scanning -->
  <g>
    ${qrRects.join("\n    ")}
  </g>
</svg>`;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const fileEnv = await loadEnvFile();
  const runtime = process.env;

  const candidates = [
    runtime.NEXT_PUBLIC_SITE_URL, runtime.SITE_URL, runtime.APP_URL,
    runtime.WEBSITE_URL,          runtime.VERCEL_URL,
    fileEnv.NEXT_PUBLIC_SITE_URL, fileEnv.SITE_URL, fileEnv.APP_URL,
    fileEnv.WEBSITE_URL,          fileEnv.VERCEL_URL,
  ];
  const targetUrl = candidates.map(normalizeUrl).find(Boolean) ?? "http://localhost:3000";

  const outDir = path.join(rootDir, "public");
  await fs.mkdir(outDir, { recursive: true });

  const hybridQrSide = HYBRID_QR_SIDE;
  const safeSvgForHybrid = await buildScanSafeSVG(targetUrl, hybridQrSide);
  const hybridSvg = buildHybridCanvasSVG(toDataUri("image/svg+xml", safeSvgForHybrid), hybridQrSide);
  const svgPath = path.join(outDir, "website-qr.svg");
  await fs.writeFile(svgPath, hybridSvg, "utf8");
  console.log(`SVG generated : ${svgPath} (hybrid)`);

  const safeSvg = await buildScanSafeSVG(targetUrl);
  const safeSvgPath = path.join(outDir, "website-qr-safe.svg");
  await fs.writeFile(safeSvgPath, safeSvg, "utf8");

  const safePng = await buildScanSafePNG(targetUrl);
  const safePngPath = path.join(outDir, "website-qr-safe.png");
  await fs.writeFile(safePngPath, safePng);
  console.log(`Safe PNG      : ${safePngPath}`);
  console.log(`Safe SVG      : ${safeSvgPath}`);

  try {
    const sharp   = (await import("sharp")).default;
    const pngPath = path.join(outDir, "website-qr.png");
    const safePngForHybrid = await buildScanSafePNG(targetUrl, hybridQrSide);
    const hybridFrameSvg = buildHybridCanvasSVG(null, hybridQrSide);
    await sharp({
      create: {
        width: HYBRID_SIDE,
        height: HYBRID_SIDE,
        channels: 4,
        background: "#060606",
      },
    })
      .composite([{ input: Buffer.from(hybridFrameSvg), left: 0, top: 0 }])
      .composite([{ input: safePngForHybrid, left: HYBRID_QR_POS, top: HYBRID_QR_POS }])
      .png({ compressionLevel: 1 })
      .toFile(pngPath);
    console.log(`PNG generated : ${pngPath} (hybrid)`);
  } catch {
    console.log(`PNG skipped   — open website-qr.svg in a browser to print / scan`);
  }

  console.log(`Target URL    : ${targetUrl}`);
}

main().catch((err) => {
  console.error("Failed to generate QR:", err);
  process.exit(1);
});

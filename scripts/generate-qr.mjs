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

// ── SVG canvas ───────────────────────────────────────────────────────
const MARGIN = 48;   // quiet zone padding around QR
const QR_SZ  = 720;  // QR area size in px
const W      = QR_SZ + MARGIN * 2;
const H      = W;

function buildSVG(url) {
  // Raw QR data matrix (error-correction H = 30% recovery)
  const qr    = QRCode.create(url, { errorCorrectionLevel: "H" });
  const mods  = qr.modules;
  const count = mods.size;
  const ms    = QR_SZ / count;
  const pad   = ms * 0.08;
  const inner = (ms - 2 * pad).toFixed(1);
  const rxMod = (ms * 0.28).toFixed(1);

  const qrRects = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (mods.data[row * count + col] === 1) {
        const x = (MARGIN + col * ms + pad).toFixed(1);
        const y = (MARGIN + row * ms + pad).toFixed(1);
        qrRects.push(`<rect x="${x}" y="${y}" width="${inner}" height="${inner}" rx="${rxMod}"/>`);
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#060606"/>

  <!-- QR modules -->
  <g fill="#e01818" filter="url(#glow)">
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

  const svg    = buildSVG(targetUrl);
  const outDir = path.join(rootDir, "public");
  await fs.mkdir(outDir, { recursive: true });

  // Always write SVG (pure JS, no extra deps)
  const svgPath = path.join(outDir, "website-qr.svg");
  await fs.writeFile(svgPath, svg, "utf8");
  console.log(`SVG generated : ${svgPath}`);

  // Also try PNG via sharp (installed automatically by Next.js)
  try {
    const sharp   = (await import("sharp")).default;
    const pngPath = path.join(outDir, "website-qr.png");
    await sharp(Buffer.from(svg)).png().toFile(pngPath);
    console.log(`PNG generated : ${pngPath}`);
  } catch {
    console.log(`PNG skipped   — open website-qr.svg in a browser to print / scan`);
  }

  console.log(`Target URL    : ${targetUrl}`);
}

main().catch((err) => {
  console.error("Failed to generate QR:", err);
  process.exit(1);
});

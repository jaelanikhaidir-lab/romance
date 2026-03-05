import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function parseEnv(raw) {
  const map = {};
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

function normalizeUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

async function loadEnvFile() {
  try {
    const envPath = path.join(rootDir, ".env");
    const raw = await fs.readFile(envPath, "utf8");
    return parseEnv(raw);
  } catch {
    return {};
  }
}

async function main() {
  const fileEnv = await loadEnvFile();
  const runtime = process.env;

  const candidates = [
    runtime.NEXT_PUBLIC_SITE_URL,
    runtime.SITE_URL,
    runtime.APP_URL,
    runtime.WEBSITE_URL,
    runtime.VERCEL_URL,
    fileEnv.NEXT_PUBLIC_SITE_URL,
    fileEnv.SITE_URL,
    fileEnv.APP_URL,
    fileEnv.WEBSITE_URL,
    fileEnv.VERCEL_URL,
  ];

  const targetUrl =
    candidates.map(normalizeUrl).find(Boolean) ?? "http://localhost:3000";

  const outputPath = path.join(rootDir, "public", "website-qr.png");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await QRCode.toFile(outputPath, targetUrl, {
    type: "png",
    width: 768,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  console.log(`QR generated: ${outputPath}`);
  console.log(`Target URL : ${targetUrl}`);
}

main().catch((err) => {
  console.error("Failed to generate QR:", err);
  process.exit(1);
});

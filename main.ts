// main.ts — bring-the-humans-03 (program/v1, Node 22, stdlib only)
//
// Copies VIDEO.json from the repository root to the output directory.
// That is all it has to do. It validates the URL first and refuses
// anything that is not a real TikTok video address, so a placeholder
// or a short link can never be submitted by accident.
//
// Usage: node main.ts
//   Reads  ./VIDEO.json
//   Writes $MAKEFUN_OUTPUT_DIR/VIDEO.json (or ./output/VIDEO.json)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// A real TikTok video address, as the bounty rules define it:
//   https://www.tiktok.com/@<handle>/video/<id>   (id digits only)
//   m.tiktok.com is accepted too. A query string or fragment after
//   it is read past (stripped). Short links (vm/vt/tiktok.com/t/),
//   photo posts (/photo/<id>) and placeholders are refused.
function normalizeUrl(raw) {
  if (typeof raw !== "string" || raw.trim() === "") {
    fail("VIDEO.json has no url");
  }
  let url = raw.trim();
  if (url.includes("<") || url.includes(">") || /REPLACE|TODO|PLACEHOLDER/i.test(url)) {
    fail("VIDEO.json still holds a placeholder url");
  }
  // Strip any query string or fragment; they are read past, never kept.
  url = url.split("?")[0].split("#")[0];
  // Scheme and host are case-insensitive; normalise them so a pasted
  // link with an upper-case host still validates.
  url = url.replace(/^https:\/\/[^/]+/i, (m) => m.toLowerCase());
  const match = url.match(/^https:\/\/(www\.|m\.)?tiktok\.com\/@([A-Za-z0-9._-]+)\/video\/(\d+)\/?$/);
  if (!match) {
    fail(`url is not a TikTok video address: ${url}`);
  }
  return `https://www.tiktok.com/@${match[2]}/video/${match[3]}`;
}

const inputPath = join(HERE, "VIDEO.json");
if (!existsSync(inputPath)) fail("VIDEO.json not found next to main.ts");

let data;
try {
  data = JSON.parse(readFileSync(inputPath, "utf8"));
} catch (err) {
  fail(`VIDEO.json does not parse: ${err.message}`);
}
if (!data || typeof data !== "object" || Array.isArray(data)) {
  fail("VIDEO.json must be a JSON object");
}

const cleanUrl = normalizeUrl(data.url);

// Write exactly one file. Never remove the output directory itself,
// only write into it (the grader mounts it root-owned).
mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "VIDEO.json");
writeFileSync(outPath, JSON.stringify({ url: cleanUrl }) + "\n", "utf8");
console.log(`main.ts: wrote ${outPath}`);
console.log(`main.ts: ${cleanUrl}`);

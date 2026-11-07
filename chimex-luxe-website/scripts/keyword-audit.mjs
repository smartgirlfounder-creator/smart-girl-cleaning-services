// Counts where each target keyword appears in the built pages (title, H1, headings, body).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const DIST = "dist";
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(DIST).filter((f) => f.endsWith("index.html")).map((f) => {
  const h = readFileSync(f, "utf8");
  const text = h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ").toLowerCase();
  const title = (h.match(/<title>([^<]*)/) || [])[1].toLowerCase(), h1 = (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").toLowerCase();
  return { url: f.replace(DIST, "").replace("index.html", ""), text, title, h1 };
});
const KW = JSON.parse(readFileSync(process.argv[2], "utf8"));
const rows = [];
for (const k of KW) {
  const kk = k.toLowerCase();
  const hits = pages.filter((p) => p.text.includes(kk));
  const strong = pages.filter((p) => p.title.includes(kk) || p.h1.includes(kk)).map((p) => p.url);
  rows.push({ k, pages: hits.length, strong });
}
for (const r of rows) console.log(`${r.pages ? (r.strong.length ? "✓✓" : "✓ ") : "✗ "} ${String(r.pages).padStart(2)} pages  ${r.k}${r.strong.length ? "   [title/H1: " + r.strong.join(", ") + "]" : ""}`);

// Quality checks on the built site. Run after `npm run build`: npm run check
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));
const fail = [], titles = new Map(), descs = new Map();
const WA = "https://wa.me/2347069341675";

for (const f of htmlFiles) {
  const h = readFileSync(f, "utf8"), rel = f.replace(DIST, "");
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail.push(`${rel}: ${h1} <h1> tags`);
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1], d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!t) fail.push(`${rel}: no title`); else { if (t.length > 70) fail.push(`${rel}: title ${t.length} chars`); if (titles.has(t)) fail.push(`${rel}: duplicate title with ${titles.get(t)}`); titles.set(t, rel); }
  if (!d) fail.push(`${rel}: no description`); else { if (d.length > 165) fail.push(`${rel}: description ${d.length} chars`); if (descs.has(d)) fail.push(`${rel}: duplicate description`); descs.set(d, rel); }
  if (!/rel="canonical"/.test(h)) fail.push(`${rel}: no canonical`);
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail.push(`${rel}: invalid JSON-LD`); } }
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) fail.push(`${rel}: img without alt`);
  for (const [, href] of h.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith("/") && !href.startsWith("//")) {
      const p = href.split("#")[0];
      const target = p.endsWith("/") ? join(DIST, p, "index.html") : join(DIST, p);
      if (!existsSync(target)) fail.push(`${rel}: broken link ${href}`);
    } else if (href.startsWith("https://wa.me/") && !href.startsWith(WA + "?text=")) fail.push(`${rel}: wrong WhatsApp link ${href.slice(0, 40)}`);
    else if (href.startsWith("tel:") && href !== "tel:+2347069341675") fail.push(`${rel}: wrong phone link ${href}`);
  }
  for (const [, src] of h.matchAll(/(?:src|poster)="(\/[^"]+)"/g)) if (!existsSync(join(DIST, src))) fail.push(`${rel}: missing file ${src}`);
  for (const [, set] of h.matchAll(/srcset="([^"]+)"/g)) for (const part of set.split(",")) { const u = part.trim().split(" ")[0]; if (!existsSync(join(DIST, u))) fail.push(`${rel}: missing ${u}`); }
  if (!/data-track="whatsapp_click"/.test(h)) fail.push(`${rel}: no WhatsApp button`);
  if (/TODO|lorem/i.test(h.replace(/<!--[\s\S]*?-->/g, ""))) fail.push(`${rel}: placeholder text`);
}
const sm = readFileSync(join(DIST, "sitemap.xml"), "utf8");
console.log(`${htmlFiles.length} HTML files, ${(sm.match(/<loc>/g) || []).length} sitemap URLs, ${titles.size} unique titles`);
if (fail.length) { console.error("FAILED:\n- " + fail.join("\n- ")); process.exit(1); }
console.log("All checks passed.");

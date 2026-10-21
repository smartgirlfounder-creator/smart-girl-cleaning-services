// Turns the single-file build (dist/index.html) into a page body for hosting as a
// claude.ai Artifact, which supplies its own <html>/<head>/<body> wrapper.
// Usage: npm run build && npm run artifact  ->  dist/artifact.html
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
const scripts = [...head.matchAll(/<script\b[\s\S]*?<\/script>/g)].map((m) => m[0]);
const headRest = head
  .replace(/<script\b[\s\S]*?<\/script>/g, "")
  .replace(/<meta charset[^>]*>/i, "")
  .replace(/<meta name="viewport"[^>]*>/i, "");
const title = headRest.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? "<title>Smart Cleaners Academy</title>";
const out = [
  title,
  '<meta name="claude:viewport-fit-sides" content="cover">',
  headRest.replace(title, "").trim(),
  body.trim(),
  ...scripts,
].join("\n");
writeFileSync("dist/artifact.html", out);
console.log(`dist/artifact.html written (${(out.length / 1024).toFixed(1)} kB)`);

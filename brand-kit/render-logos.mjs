import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@500;600;700&family=Poppins:wght@400;600&display=swap">`;
const spark = (c, s=1) => `<svg width="${56*s}" height="${56*s}" viewBox="0 0 56 56"><path d="M28 2 C30 20 36 26 54 28 C36 30 30 36 28 54 C26 36 20 30 2 28 C20 26 26 20 28 2Z" fill="${c}"/><path d="M47 4 C47.6 9 49 10.4 54 11 C49 11.6 47.6 13 47 18 C46.4 13 45 11.6 40 11 C45 10.4 46.4 9 47 4Z" fill="${c}" opacity=".7"/></svg>`;
const C = { burg:'#5C1729', deep:'#2E0A15', rose:'#8A3B4F', gold:'#E2BF9C', ivory:'#FFFAF8' };
const horiz = (main, sub, sp) => `<div style="display:flex;align-items:center;gap:22px;padding:30px 40px">
  ${spark(sp,1.5)}
  <div style="display:flex;flex-direction:column;line-height:1">
    <div style="font:400 104px/0.95 'Great Vibes';color:${main};padding:0 10px 0 0">Smart Girl</div>
    <div style="font:600 25px/1 Montserrat;letter-spacing:.38em;color:${sub};margin-top:30px;padding-left:6px">CLEANING SERVICES</div>
  </div></div>`;
const stacked = (main, sub, sp) => `<div style="display:flex;flex-direction:column;align-items:center;padding:36px 48px;text-align:center">
  ${spark(sp,1.3)}
  <div style="font:400 120px/1 'Great Vibes';color:${main};margin-top:4px;padding:0 12px">Smart Girl</div>
  <div style="font:600 26px/1 Montserrat;letter-spacing:.4em;color:${sub};margin-top:34px;padding-left:.4em">CLEANING SERVICES</div></div>`;
const mono = (bg, fg) => `<div style="width:600px;height:600px;border-radius:50%;background:${bg};display:grid;place-items:center;position:relative">
  <div style="position:absolute;inset:26px;border:3px solid ${fg};border-radius:50%;opacity:.55"></div>
  <div style="font:400 240px/1 'Great Vibes';color:${fg};transform:translate(-4px,-6px)">SG</div></div>`;
const banner = `<div style="width:1200px;height:360px;background:${C.deep};display:grid;place-items:center">
  <div style="display:flex;flex-direction:column;align-items:center">${horiz(C.ivory, C.gold, C.gold)}
  <div style="font:400 22px/1 Poppins;color:#E4C9C3;letter-spacing:.06em;margin-top:0">Home · Deep · Post-construction · Office cleaning in Ilorin</div></div></div>`;
const jobs = [
  ['smart-girl-logo-horizontal-burgundy.png', horiz(C.burg, C.rose, C.gold), true],
  ['smart-girl-logo-horizontal-white.png', horiz(C.ivory, C.gold, C.gold), true],
  ['smart-girl-logo-stacked-burgundy.png', stacked(C.burg, C.rose, C.gold), true],
  ['smart-girl-logo-stacked-white.png', stacked(C.ivory, C.gold, C.gold), true],
  ['smart-girl-monogram-burgundy.png', mono(C.burg, C.gold), true],
  ['smart-girl-monogram-gold.png', mono(C.gold, C.deep), true],
  ['smart-girl-email-header-1200x360.png', banner, false],
];
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 2 });
for (const [name, html, transparent] of jobs) {
  await p.setContent(`<!doctype html><html><head>${FONTS}<style>html,body{margin:0;background:transparent}#x{display:inline-block}</style></head><body><div id="x">${html}</div></body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.locator('#x').screenshot({ path: `${out}/${name}`, omitBackground: transparent });
  console.log(name);
}
await b.close();

import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = process.argv[2];
const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@500;600;700&family=Poppins:wght@400;600&display=swap">`;
const C = { burg:'#5C1729', deep:'#2E0A15', rose:'#8A3B4F', gold:'#E2BF9C', ivory:'#FFFAF8' };
const SUB = 'BUSINESS EDUCATOR &nbsp;·&nbsp; ENTREPRENEUR &nbsp;·&nbsp; SPEAKER';
const horiz = (main, sub, rule) => `<div style="display:flex;flex-direction:column;align-items:center;padding:30px 44px">
  <div style="font:400 120px/1 'Great Vibes';color:${main};padding:0 14px">Kaffy Olaitan</div>
  <div style="width:90px;height:2px;background:${rule};margin:22px 0 18px"></div>
  <div style="font:600 21px/1 Montserrat;letter-spacing:.3em;color:${sub};padding-left:.3em">${SUB}</div></div>`;
const stacked = (main, sub, rule) => `<div style="display:flex;flex-direction:column;align-items:center;padding:36px 52px;text-align:center">
  <div style="font:400 130px/1 'Great Vibes';color:${main};padding:0 14px">Kaffy</div>
  <div style="font:400 130px/1.05 'Great Vibes';color:${main};padding:0 14px">Olaitan</div>
  <div style="width:80px;height:2px;background:${rule};margin:22px 0 18px"></div>
  <div style="font:600 19px/1.9 Montserrat;letter-spacing:.32em;color:${sub};padding-left:.32em">BUSINESS EDUCATOR<br>ENTREPRENEUR · SPEAKER</div></div>`;
const mono = (bg, fg) => `<div style="width:600px;height:600px;border-radius:50%;background:${bg};display:grid;place-items:center;position:relative">
  <div style="position:absolute;inset:26px;border:3px solid ${fg};border-radius:50%;opacity:.55"></div>
  <div style="font:400 210px/1 'Great Vibes';color:${fg};transform:translate(-6px,16px)">KO</div></div>`;
const banner = `<div style="width:1200px;height:360px;background:${C.deep};display:grid;place-items:center">
  <div style="display:flex;flex-direction:column;align-items:center">
  <div style="font:600 18px/1 Montserrat;letter-spacing:.36em;color:${C.gold};padding-left:.36em;margin-bottom:46px">THE BUSINESS GROWTH LETTER</div>
  <div style="font:400 112px/1.1 'Great Vibes';color:${C.ivory};padding:4px 14px 0">Kaffy Olaitan</div>
  <div style="width:80px;height:2px;background:${C.gold};margin:14px 0 18px"></div>
  <div style="font:400 21px/1 Poppins;color:#E4C9C3;letter-spacing:.04em">Business, marketing and the psychology of why people buy</div></div></div>`;
const jobs = [
  ['kaffy-olaitan-logo-horizontal-burgundy.png', horiz(C.burg, C.rose, C.gold), true],
  ['kaffy-olaitan-logo-horizontal-white.png', horiz(C.ivory, C.gold, C.gold), true],
  ['kaffy-olaitan-logo-stacked-burgundy.png', stacked(C.burg, C.rose, C.gold), true],
  ['kaffy-olaitan-logo-stacked-white.png', stacked(C.ivory, C.gold, C.gold), true],
  ['kaffy-olaitan-monogram-burgundy.png', mono(C.burg, C.gold), true],
  ['kaffy-olaitan-monogram-gold.png', mono(C.gold, C.deep), true],
  ['kaffy-olaitan-email-header-1200x360.png', banner, false],
];
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 2 });
for (const [name, html, transparent] of jobs) {
  await p.setContent(`<!doctype html><html><head>${FONTS}<style>html,body{margin:0;background:transparent}#x{display:inline-block}</style></head><body><div id="x">${html}</div></body></html>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.locator('#x').screenshot({ path: `${out}/${name}`, omitBackground: transparent });
}
await b.close(); console.log('done');

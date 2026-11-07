// Builds the static website into dist/. Run: npm run build
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { marked } from "marked";
import { site, wa, WA_GENERAL, reviews, photos, galleryCats, services } from "../content/site.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(root, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(root, "src"), DIST, { recursive: true });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const abs = (p) => site.url.replace(/\/$/, "") + p;
const year = new Date().getFullYear();

// ---------- images ----------
const IMG = join(root, "src/assets/img");
const files = readdirSync(IMG);
const dims = {};
for (const name of Object.keys(photos)) {
  const m = await sharp(join(IMG, `${name}.jpg`)).metadata();
  dims[name] = { w: m.width, h: m.height, widths: files.filter((f) => f.startsWith(name + "-") && f.endsWith(".webp")).map((f) => +f.slice(name.length + 1, -5)).filter(Boolean).sort((a, b) => a - b) };
}
function pic(name, { sizes = "(min-width: 900px) 50vw, 100vw", eager = false, alt } = {}) {
  const d = dims[name];
  if (!d) throw new Error(`Unknown photo ${name}`);
  const set = d.widths.map((w) => `/assets/img/${name}-${w}.webp ${w}w`).join(", ");
  return `<picture><source type="image/webp" srcset="${set}" sizes="${sizes}"><img src="/assets/img/${name}.jpg" alt="${esc(alt ?? photos[name].alt)}" width="${d.w}" height="${d.h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const big = (name) => `/assets/img/${name}-${dims[name].widths.at(-1)}.webp`;

// ---------- shared bits ----------
const WA_ICON = `<svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7a10.7 10.7 0 0 1-5.5-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7a.6.6 0 0 0 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.5 6.5 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z"/></svg>`;
const waBtn = (msg, label = "Get a Quote on WhatsApp", cls = "btn btn-wa", track = "page") =>
  `<a class="${cls}" href="${wa(msg)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="${esc(track)}">${WA_ICON}<span>${esc(label)}</span></a>`;
const stars = (n = 5) => `<span class="stars" aria-label="${n} out of 5 stars">${"★".repeat(n)}</span>`;

const business = {
  "@type": "HomeAndConstructionBusiness",
  "@id": abs("/#business"),
  name: site.brand,
  alternateName: site.alsoKnownAs,
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "00:00", closes: "23:59" }],
  description: "Supply, fabrication and installation of marble, granite and quartz kitchen countertops, vanity tops, tabletops, backsplashes and stone tombstones in Lagos.",
  url: abs("/"),
  telephone: site.phoneDisplay.replace(/\s/g, ""),
  image: abs("/assets/img/black-stone-kitchen-island.jpg"),
  address: { "@type": "PostalAddress", streetAddress: site.street, addressLocality: site.locality, addressRegion: site.region, postalCode: site.postalCode, addressCountry: site.country },
  areaServed: { "@type": "City", name: "Lagos" },
  ...(site.googleBusinessUrl ? { hasMap: site.googleBusinessUrl } : {}),
  ...([site.googleBusinessUrl, site.facebookUrl].filter(Boolean).length ? { sameAs: [site.googleBusinessUrl, site.facebookUrl].filter(Boolean) } : {}),
  ...(site.email ? { email: site.email } : {}),
};
const crumbsSchema = (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it[0], item: abs(it[1]) })) });
const crumbsHtml = (items) => `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${items.map((it, i) => i === items.length - 1 ? `<li aria-current="page">${esc(it[0])}</li>` : `<li><a href="${it[1]}">${esc(it[0])}</a></li>`).join("")}</ol></nav>`;

const NAV = [["/services/", "Services"], ["/our-work/", "Our Work"], ["/about/", "About"], ["/blog/", "Blog"], ["/contact/", "Contact"]];

function layout({ path, title, description, body, schema = [], ogImage = "black-stone-kitchen-island", waMsg = WA_GENERAL, type = "website" }) {
  const graph = { "@context": "https://schema.org", "@graph": [business, ...schema] };
  const ga = site.ga4Id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.ga4Id}');</script>` : "<!-- GA4: set ga4Id in content/site.mjs to enable analytics -->";
  return `<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(path)}">
${site.gscVerification ? `<meta name="google-site-verification" content="${esc(site.gscVerification)}">` : ""}
<meta name="theme-color" content="#121214">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs(`/assets/img/${ogImage}.jpg`)}">
<meta property="og:locale" content="en_NG">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23121214'/%3E%3Ctext x='32' y='43' font-family='Georgia' font-size='30' text-anchor='middle' fill='%23c9a876'%3ECL%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Marcellus&display=swap">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">${JSON.stringify(graph)}</script>
${ga}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
  <div class="wrap top-in">
    <a class="logo" href="/" aria-label="${esc(site.brand)} home"><b>CHIMEXPRIME</b><span>Global Ventures</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
      ${NAV.map(([h, l]) => `<a href="${h}"${path.startsWith(h) ? ' aria-current="page"' : ""}>${l}</a>`).join("")}
      ${waBtn(waMsg, "Get a Quote", "btn btn-wa", "header")}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <a class="logo" href="/"><b>CHIMEXPRIME</b><span>Global Ventures</span></a>
        <p style="margin-top:16px">Marble, granite and quartz countertops, vanity tops, tabletops, backsplashes and tombstones. Supply, fabrication and installation in Lagos.</p>
        <address class="nap">
          <span>${esc(site.street)}, ${esc(site.locality)}, Lagos ${esc(site.postalCode)}, Nigeria</span>
          <span>${esc(site.hours)}</span>
          <a href="${site.phoneHref}" data-track="phone_click" data-label="footer">${esc(site.phoneDisplay)}</a>
          <a href="${wa(waMsg)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="footer">WhatsApp us</a>
        </address>
      </div>
      <div><h3>Countertops</h3><ul>${services.slice(0, 5).map((s) => `<li><a href="/services/${s.slug}/">${esc(s.nav)}</a></li>`).join("")}</ul></div>
      <div><h3>More services</h3><ul>${services.slice(5).map((s) => `<li><a href="/services/${s.slug}/">${esc(s.nav)}</a></li>`).join("")}<li><a href="/our-work/">Our Work</a></li></ul></div>
      <div><h3>Company</h3><ul><li><a href="/about/">About</a></li><li><a href="/blog/">Blog</a></li><li><a href="/contact/">Contact</a></li>${site.googleBusinessUrl ? `<li><a href="${site.googleBusinessUrl}" target="_blank" rel="noopener">Find us on Google</a></li>` : ""}</ul></div>
    </div>
    <small>© ${year} ${esc(site.brand)} (${esc(site.alsoKnownAs)}). All project photos show our own work.</small>
  </div>
</footer>
<a class="wa-float" href="${wa(waMsg)}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp" data-track="whatsapp_click" data-label="floating">${WA_ICON}</a>
<script src="/main.js" defer></script>
</body>
</html>`;
}

function write(path, html) {
  const file = path.endsWith(".html") ? join(DIST, path) : join(DIST, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}
const pages = [];
const add = (path, opts) => { write(path, layout({ path, ...opts })); if (!path.endsWith(".html")) pages.push({ path, lastmod: opts.lastmod }); };

// ---------- shared sections ----------
const svcCard = (s) => `<a class="svc" href="/services/${s.slug}/"><div class="im">${pic(s.images[0], { sizes: "(min-width: 980px) 25vw, (min-width: 640px) 50vw, 100vw", alt: "" })}</div><div class="tx"><h3>${esc(s.nav)}</h3><p>${esc(s.meta.split(".")[0])}.</p><span class="more">View service</span></div></a>`;
const reviewsHtml = `<div class="grid g3">${reviews.map((r) => `<figure class="review">${stars(r.stars)}<blockquote>“${esc(r.text)}”</blockquote><figcaption><b>${esc(r.name)}</b> · ${esc(r.source)}</figcaption></figure>`).join("")}</div>`;
const faqHtml = (faqs) => `<div class="faq">${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><div><p>${f.a}</p></div></details>`).join("")}</div>`;
const ctaBand = (msg, h = "Ready to transform your kitchen?", p = "Send us photos or measurements of your space on WhatsApp and we will prepare a quotation.") =>
  `<section class="section cta"><div class="wrap narrow"><h2>${esc(h)}</h2><p class="lede" style="margin-inline:auto;color:#cfcbc4">${esc(p)}</p><div class="btns">${waBtn(msg, "Request a Quotation", "btn btn-wa", "cta")}<a class="btn btn-line" href="${site.phoneHref}" data-track="phone_click" data-label="cta">Call ${esc(site.phoneDisplay)}</a></div></div></section>`;
const processSteps = `<ol class="steps">
  <li><h3>Consultation</h3><p>Share photos, measurements or drawings on WhatsApp. We discuss the look you want and the right stone for your space.</p></li>
  <li><h3>Site measurement</h3><p>We measure your cabinets and confirm sink, hob and tap positions so every piece fits.</p></li>
  <li><h3>Fabrication</h3><p>The stone is cut to size, edges are shaped and polished, and openings are cut precisely.</p></li>
  <li><h3>Installation &amp; finishing</h3><p>We fit, level and finish on site, then show you how to care for your new surface.</p></li>
</ol>`;

// ---------- articles ----------
function parseArticle(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const fm = Object.fromEntries(m[1].split("\n").map((l) => { const i = l.indexOf(":"); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  return { ...fm, slug: file.split("/").pop().replace(/\.md$/, ""), services: fm.services.split(",").map((s) => s.trim()), md: m[2] };
}
const articles = readdirSync(join(root, "content/articles")).filter((f) => f.endsWith(".md")).map((f) => parseArticle(join(root, "content/articles", f)));
const renderer = new marked.Renderer();
renderer.table = function (token) { return `<div class="table-wrap">${marked.Renderer.prototype.table.call(this, token)}</div>`; };
marked.use({ renderer });

// ---------- HOME ----------
const generalFaqs = [
  { q: "Which areas do you serve?", a: "We are based in Ajeromi-Ifelodun, Lagos, and work on homes and projects in Lagos. Send your location on WhatsApp to confirm availability for your area." },
  { q: "Which materials do you work with?", a: "Marble, granite and quartz, for kitchen countertops, islands, vanity tops, tabletops, backsplashes and custom stone pieces, as well as tombstones and grave monuments." },
  { q: "How do I get a quotation?", a: "Send photos of your space, rough measurements and the look you want on WhatsApp. We will advise on materials and arrange measurement for an accurate quotation." },
  { q: "Do you supply the stone as well as install it?", a: "Yes. We source the stone, fabricate it and install it, so you deal with one team from selection to finishing." },
  { q: "Do you work with contractors and interior designers?", a: "Yes. We work with homeowners, builders, architects, interior designers and property developers." },
];
add("/", {
  title: "Marble, Granite & Quartz Countertops in Lagos | Chimexprime",
  description: "Premium marble, granite and quartz kitchen countertops in Lagos: supply, fabrication and installation. See our real projects and get a quotation on WhatsApp.",
  body: `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="eyebrow">Marble · Granite · Quartz · Lagos</p>
      <h1>Premium Marble, Granite &amp; Quartz Kitchen Countertops in Lagos</h1>
      <p class="lede">We supply, fabricate and install stone countertops, islands, vanity tops and backsplashes, measured for your space and finished by hand on site.</p>
      <div class="btns">${waBtn(WA_GENERAL, "Get a Free Quotation", "btn btn-wa", "hero")}<a class="btn btn-line" href="/our-work/">See Our Work</a></div>
      <ul class="trust">
        <li>${stars()} 5.0 on Google</li>
        <li>Supply · Fabrication · Installation</li>
        <li>Ajeromi-Ifelodun, Lagos</li>
      </ul>
    </div>
    <div class="hero-photo">${pic("black-stone-kitchen-island", { eager: true })}</div>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div>
      <p class="eyebrow">Chimexprime Global Ventures</p>
      <h2>Stone surfaces that make a home feel finished</h2>
      <p class="lede">A kitchen countertop is the surface you touch every day. We help homeowners, builders and designers in Lagos choose the right stone and then cut and fit it with care, from the first measurement to the final polish.</p>
      <ul class="ticks"><li>Marble, granite and quartz kitchen countertops</li><li>Islands, upstands and backsplashes</li><li>Bathroom vanity tops and tabletops</li><li>Tombstones and custom stonework</li></ul>
      <a class="btn btn-dark" href="/services/">Explore Our Services</a>
    </div>
    <div class="media">${pic("l-shaped-kitchen-white-countertops")}</div>
  </div>
</section>

<section class="section stone">
  <div class="wrap">
    <div class="center"><p class="eyebrow">What we do</p><h2>Our services</h2><p class="lede">From a single vanity top to a complete kitchen, every piece is cut for your space.</p></div>
    <div class="grid g4" style="margin-top:34px">${services.map(svcCard).join("")}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="center"><p class="eyebrow">Recent projects</p><h2>Our work speaks for itself</h2><p class="lede">Real kitchens, bathrooms and memorials completed by our team.</p></div>
    <div class="mosaic" style="margin-top:34px">${["grey-veined-stone-island", "white-countertop-and-backsplash", "white-kitchen-black-countertop", "white-l-shaped-countertop-dark-cabinets", "stone-bathroom-vanity-top", "undermount-sink-cutout"].map((n) => `<figure>${pic(n, { sizes: "(min-width: 980px) 33vw, 50vw" })}</figure>`).join("")}</div>
    <div class="center btns" style="justify-content:center"><a class="btn btn-dark" href="/our-work/">View All Projects</a></div>
  </div>
</section>

<section class="section dark">
  <div class="wrap split">
    <div>
      <p class="eyebrow">How we work</p>
      <h2>From measurement to the final polish</h2>
      <p>Watch our installer cutting and polishing a white stone countertop on site. Precision at every stage is what makes the finished kitchen look right.</p>
      ${processSteps}
    </div>
    <div class="video"><video src="/assets/video/fabrication-installation.mp4" poster="/assets/video/fabrication-installation-poster.jpg" muted loop playsinline controls preload="none" aria-label="Our installer cutting and polishing a stone countertop on site"></video></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="center"><p class="eyebrow">Why clients choose us</p><h2>Craftsmanship you can see</h2></div>
    <div class="grid g3" style="margin-top:30px">
      <div><h3>Measured for your space</h3><p>We measure on site and plan sink, hob and tap cut-outs before cutting, so the stone fits your cabinets exactly.</p></div>
      <div><h3>Supply to installation</h3><p>One team sources, fabricates and installs, so you are not left coordinating suppliers and fitters.</p></div>
      <div><h3>Finished by hand</h3><p>Edges are polished and joints finished on site for a clean, premium result.</p></div>
      <div><h3>Advice on the right stone</h3><p>Marble, granite or quartz? We explain the differences honestly, so you choose what suits how you live.</p></div>
      <div><h3>Easy to reach</h3><p>Send photos and questions on WhatsApp and get clear answers about your project.</p></div>
      <div><h3>Trusted by clients</h3><p>Rated 5.0 on Google by our customers. Read their reviews below.</p></div>
    </div>
  </div>
</section>

<section class="section stone">
  <div class="wrap">
    <div class="center"><p class="eyebrow">Reviews</p><h2>What our clients say</h2></div>
    <div style="margin-top:30px">${reviewsHtml}</div>
    ${site.googleBusinessUrl ? `<p class="center" style="margin-top:22px"><a href="${site.googleBusinessUrl}" target="_blank" rel="noopener">Read our reviews on Google</a></p>` : ""}
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <div class="center"><p class="eyebrow">FAQ</p><h2>Frequently asked questions</h2></div>
    ${faqHtml(generalFaqs)}
  </div>
</section>
${ctaBand(WA_GENERAL)}`,
});

// ---------- SERVICES INDEX ----------
add("/services/", {
  title: "Marble, Granite & Quartz Services in Lagos | Chimexprime",
  description: "Kitchen countertops, slab supply, fabrication, installation, vanity tops and tombstones in marble, granite and quartz. Lagos. Request a quote on WhatsApp.",
  schema: [crumbsSchema([["Home", "/"], ["Services", "/services/"]])],
  body: `${crumbsHtml([["Home", "/"], ["Services", "/services/"]])}
<section class="section" style="padding-top:30px"><div class="wrap">
  <h1>Our Stone Services in Lagos</h1>
  <p class="lede">Choose a service to see what is included, real project photos and answers to common questions.</p>
  <div class="grid g4" style="margin-top:34px">${services.map(svcCard).join("")}</div>
</div></section>${ctaBand(WA_GENERAL)}`,
});

// ---------- SERVICE PAGES ----------
for (const s of services) {
  const path = `/services/${s.slug}/`;
  const crumbs = [["Home", "/"], ["Services", "/services/"], [s.nav, path]];
  const rel = s.related.map((r) => services.find((x) => x.slug === r)).filter(Boolean);
  const relArticles = articles.filter((a) => a.services.includes(s.slug));
  add(path, {
    title: s.title, description: s.meta, ogImage: s.images[0], waMsg: s.wa,
    schema: [crumbsSchema(crumbs), { "@type": "Service", "@id": abs(path + "#service"), name: s.h1, serviceType: s.nav, description: s.meta, provider: { "@id": abs("/#business") }, areaServed: { "@type": "City", name: "Lagos" }, url: abs(path), image: abs(`/assets/img/${s.images[0]}.jpg`) }],
    body: `${crumbsHtml(crumbs)}
<section class="page-hero"><div class="wrap page-hero-grid">
  <div><p class="eyebrow">${esc(s.nav)}</p><h1>${esc(s.h1)}</h1><p class="lede">${esc(s.intro)}</p><div class="btns">${waBtn(s.wa, "Request a Quotation", "btn btn-wa", s.slug)}<a class="btn btn-line" href="/our-work/">See Our Work</a></div></div>
  <div class="ph-img">${pic(s.images[0], { eager: true })}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div>${s.sections.map(([h, html]) => `<h2>${esc(h)}</h2>${html}`).join("")}</div>
  <div>
    <h3>Benefits</h3><ul class="ticks">${s.benefits.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    <h3>Where it is used</h3><ul class="ticks">${s.applications.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    ${waBtn(s.wa, "Ask About This Service", "btn btn-wa", s.slug + "-benefits")}
  </div>
</div></section>
${s.video ? `<section class="section dark"><div class="wrap split"><div><p class="eyebrow">On site</p><h2>See our fabrication and installation</h2>${processSteps}</div><div class="video"><video src="/assets/video/${s.video}.mp4" poster="/assets/video/${s.video}-poster.jpg" muted loop playsinline controls preload="none" aria-label="Our installer cutting and polishing a stone countertop on site"></video></div></div></section>` : ""}
<section class="section stone"><div class="wrap">
  <h2>Project photos</h2>
  <div class="mosaic" style="margin-top:24px">${s.images.map((n) => `<figure>${pic(n, { sizes: "(min-width: 980px) 33vw, 50vw" })}<figcaption>${esc(photos[n].alt)}</figcaption></figure>`).join("")}</div>
  <a class="btn btn-dark" href="/our-work/">View more projects</a>
</div></section>
<section class="section"><div class="wrap narrow">
  <h2>Frequently asked questions</h2>
  ${faqHtml(s.faqs)}
  ${relArticles.length ? `<h3 style="margin-top:40px">Helpful guides</h3><ul class="ticks">${relArticles.map((a) => `<li><a href="/blog/${a.slug}/">${esc(a.title)}</a></li>`).join("")}</ul>` : ""}
</div></section>
<section class="section stone"><div class="wrap"><h2>Related services</h2><div class="grid g3" style="margin-top:24px">${rel.map(svcCard).join("")}</div></div></section>
${ctaBand(s.wa, `Get a quotation for ${s.nav.toLowerCase()}`)}`,
  });
}

// ---------- OUR WORK ----------
add("/our-work/", {
  title: "Our Work: Kitchen Countertop Projects in Lagos | Chimexprime",
  description: "See real marble, granite and quartz projects by Chimexprime Global Ventures: kitchen countertops, islands, vanity tops, fabrication on site and tombstones in Lagos.",
  ogImage: "grey-veined-stone-island",
  schema: [crumbsSchema([["Home", "/"], ["Our Work", "/our-work/"]]), { "@type": "ImageGallery", name: "Chimexprime project gallery", url: abs("/our-work/"), image: Object.keys(photos).map((n) => ({ "@type": "ImageObject", contentUrl: abs(`/assets/img/${n}.jpg`), caption: photos[n].alt })) }],
  body: `${crumbsHtml([["Home", "/"], ["Our Work", "/our-work/"]])}
<section class="section" style="padding-top:30px"><div class="wrap">
  <h1>Our Work</h1>
  <p class="lede">Every photo and video here is from a real Chimexprime project. Tap a photo to view it larger.</p>
  <div class="filters" role="group" aria-label="Filter projects" style="margin-top:28px"><button type="button" data-cat="all" aria-pressed="true">All</button>${galleryCats.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="false">${esc(c.label)}</button>`).join("")}</div>
  <div class="mosaic">${Object.entries(photos).map(([n, p]) => `<figure data-cat="${p.cat}"><button type="button" data-full="${big(n)}" data-alt="${esc(p.alt)}" aria-label="View larger: ${esc(p.alt)}">${pic(n, { sizes: "(min-width: 980px) 33vw, 50vw" })}</button><figcaption>${esc(p.alt)}<br><a href="${wa(`Hello, I saw this on your website (“${p.alt}”) and I would like something similar. Please send me a quotation.`)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="gallery">Ask about a similar project →</a></figcaption></figure>`).join("")}</div>
</div></section>
<section class="section dark"><div class="wrap">
  <h2>Project videos</h2>
  <div class="grid g2" style="margin-top:24px">
    <figure style="margin:0"><div class="video"><video src="/assets/video/fabrication-installation.mp4" poster="/assets/video/fabrication-installation-poster.jpg" controls muted playsinline preload="none" aria-label="Cutting and polishing a white stone countertop on site"></video></div><figcaption style="margin-top:10px;text-align:center">Cutting and polishing a white stone island countertop on site</figcaption></figure>
    <figure style="margin:0"><div class="video"><video src="/assets/video/grey-stone-kitchen-walkthrough.mp4" poster="/assets/video/grey-stone-kitchen-walkthrough-poster.jpg" controls muted playsinline preload="none" aria-label="Walkthrough of a light grey veined stone kitchen countertop"></video></div><figcaption style="margin-top:10px;text-align:center">Walkthrough: light grey veined stone countertop with sink and hob cut-outs</figcaption></figure>
  </div>
</div></section>
<dialog class="lightbox" aria-label="Project photo"><button class="x" type="button" aria-label="Close">×</button><img alt=""><p></p></dialog>
${ctaBand(WA_GENERAL, "Want a result like this?")}`,
});

// ---------- ABOUT ----------
add("/about/", {
  title: "About Chimexprime Global Ventures | Stone Specialists in Lagos",
  description: "Chimexprime Global Ventures (Chimex Luxe Marble & Interiors) supplies, fabricates and installs marble, granite and quartz surfaces in Lagos.",
  schema: [crumbsSchema([["Home", "/"], ["About", "/about/"]])],
  body: `${crumbsHtml([["Home", "/"], ["About", "/about/"]])}
<section class="page-hero"><div class="wrap page-hero-grid">
  <div><p class="eyebrow">About us</p><h1>Stone specialists for Lagos homes and projects</h1><p class="lede">${esc(site.brand)}, also known as ${esc(site.alsoKnownAs)}, supplies, fabricates and installs marble, granite and quartz surfaces from our base in Ajeromi-Ifelodun, Lagos.</p></div>
  <div class="ph-img">${pic("polishing-countertop-edge", { eager: true })}</div>
</div></section>
<section class="section"><div class="wrap split">
  <div>
    <h2>What we do</h2>
    <p>We work with natural and engineered stone: marble, granite and quartz. Our work covers kitchen countertops and islands, bathroom vanity tops, tabletops, backsplashes, custom stone pieces, and tombstones and grave monuments.</p>
    <p>Because we handle supply, fabrication and installation, we can advise on the right stone, plan the cuts and joints, and take responsibility for how the finished surface looks.</p>
    <h2>Who we work with</h2>
    <ul class="ticks"><li>Homeowners building or renovating</li><li>Contractors and site engineers</li><li>Architects and interior designers</li><li>Property developers and commercial clients</li></ul>
  </div>
  <div class="media">${pic("installer-cutting-countertop")}</div>
</div></section>
<section class="section stone"><div class="wrap"><div class="center"><h2>What our clients say</h2></div><div style="margin-top:28px">${reviewsHtml}</div></div></section>
${ctaBand(WA_GENERAL, "Let's talk about your project")}`,
});

// ---------- BLOG ----------
const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
add("/blog/", {
  title: "Kitchen Countertop Guides & Advice | Chimexprime Blog",
  description: "Practical guides on marble, granite and quartz kitchen countertops: comparisons, costs, installation and care, for homeowners in Lagos.",
  schema: [crumbsSchema([["Home", "/"], ["Blog", "/blog/"]]), { "@type": "Blog", name: "Chimexprime Knowledge Centre", url: abs("/blog/"), publisher: { "@id": abs("/#business") } }],
  body: `${crumbsHtml([["Home", "/"], ["Blog", "/blog/"]])}
<section class="section" style="padding-top:30px"><div class="wrap narrow">
  <h1>Countertop Guides &amp; Advice</h1>
  <p class="lede">Honest, practical advice to help you choose, buy and care for marble, granite and quartz surfaces.</p>
  <div class="posts">${sorted.map((a) => `<a class="post" href="/blog/${a.slug}/"><div class="im">${pic(a.image, { sizes: "(min-width: 720px) 260px, 100vw", alt: "" })}</div><div><h2>${esc(a.title)}</h2><p>${esc(a.description)}</p></div></a>`).join("")}</div>
</div></section>${ctaBand(WA_GENERAL)}`,
});
for (const a of articles) {
  const path = `/blog/${a.slug}/`;
  const crumbs = [["Home", "/"], ["Blog", "/blog/"], [a.title, path]];
  const relSvc = a.services.map((s) => services.find((x) => x.slug === s)).filter(Boolean);
  const more = sorted.filter((x) => x.slug !== a.slug).slice(0, 3);
  const nice = new Date(a.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  add(path, {
    title: a.seoTitle, description: a.description, ogImage: a.image, waMsg: a.wa, type: "article", lastmod: a.date,
    schema: [crumbsSchema(crumbs), { "@type": "BlogPosting", headline: a.title, description: a.description, datePublished: a.date, dateModified: a.date, image: abs(`/assets/img/${a.image}.jpg`), mainEntityOfPage: abs(path), author: { "@type": "Organization", name: site.brand, url: abs("/") }, publisher: { "@id": abs("/#business") }, keywords: a.keyword }],
    body: `${crumbsHtml(crumbs)}
<article class="article wrap narrow">
  <h1 style="margin-top:22px">${esc(a.title)}</h1>
  <p class="meta">By ${esc(site.brand)} · <time datetime="${a.date}">${nice}</time></p>
  <div class="cover">${pic(a.image, { eager: true, sizes: "(min-width: 820px) 780px, 100vw" })}</div>
  <div class="prose">${marked.parse(a.md)}</div>
  <aside class="callout"><h3>Need help with your kitchen?</h3><p>Send us photos and measurements on WhatsApp for advice and a quotation.</p>${waBtn(a.wa, "Chat With Us on WhatsApp", "btn btn-wa", "article-" + a.slug)}</aside>
  <h2 style="font-size:26px">Related services</h2>
  <div class="grid g2" style="margin:20px 0 40px">${relSvc.map(svcCard).join("")}</div>
  <h2 style="font-size:26px">More guides</h2>
  <ul class="ticks">${more.map((m) => `<li><a href="/blog/${m.slug}/">${esc(m.title)}</a></li>`).join("")}</ul>
</article>
${ctaBand(a.wa)}`,
  });
}

// ---------- CONTACT ----------
add("/contact/", {
  title: "Contact Chimexprime | Request a Countertop Quotation in Lagos",
  description: `Contact Chimexprime Global Ventures, ${site.street}, ${site.locality}, Lagos. Call or WhatsApp ${site.phoneDisplay} for marble, granite and quartz quotations.`,
  schema: [crumbsSchema([["Home", "/"], ["Contact", "/contact/"]]), { "@type": "ContactPage", url: abs("/contact/"), about: { "@id": abs("/#business") } }],
  body: `${crumbsHtml([["Home", "/"], ["Contact", "/contact/"]])}
<section class="section" style="padding-top:30px"><div class="wrap">
  <h1>Request a Quotation</h1>
  <p class="lede">Tell us about your project. When you send the form, WhatsApp opens with your details filled in, so you can attach photos of the space and send it straight to us.</p>
  <div class="contact-grid" style="margin-top:30px">
    <form class="form" id="enquiry" data-wa="${site.whatsapp}" novalidate>
      <div><label for="name">Full name *</label><input id="name" name="name" autocomplete="name" required></div>
      <div><label for="phone">Phone number *</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div>
      <div><label for="email">Email (optional)</label><input id="email" name="email" type="email" autocomplete="email"></div>
      <div><label for="service">Service required</label><select id="service" name="service">${services.map((s) => `<option>${esc(s.nav)}</option>`).join("")}<option>Other / not sure</option></select></div>
      <div><label for="location">Project location</label><input id="location" name="location" placeholder="e.g. Surulere, Lagos"></div>
      <div><label for="details">Brief project description</label><textarea id="details" name="details" placeholder="Kitchen size, cabinet layout, the look you want…"></textarea><p class="hint">You can attach photos in WhatsApp after it opens.</p></div>
      <p class="err" role="alert"></p>
      <button class="btn btn-wa" type="submit">${WA_ICON}<span>Send Enquiry on WhatsApp</span></button>
    </form>
    <div>
      <h2 style="font-size:28px">Contact details</h2>
      <address class="nap">
        <span><b>${esc(site.brand)}</b><br>${esc(site.alsoKnownAs)}</span>
        <span>${esc(site.hours)}</span>
        <span>${esc(site.street)}, ${esc(site.locality)},<br>Lagos ${esc(site.postalCode)}, Nigeria</span>
        <a href="${site.phoneHref}" data-track="phone_click" data-label="contact">Call ${esc(site.phoneDisplay)}</a>
        <a href="${wa(WA_GENERAL)}" target="_blank" rel="noopener" data-track="whatsapp_click" data-label="contact">WhatsApp ${esc(site.phoneDisplay)}</a>
        ${site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : ""}
        ${site.googleBusinessUrl ? `<a href="${site.googleBusinessUrl}" target="_blank" rel="noopener">View us on Google</a>` : ""}
      </address>
      <iframe class="map" style="margin-top:24px" title="Map: ${esc(site.brand)} location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed"></iframe>
    </div>
  </div>
</div></section>`,
});

// ---------- 404 ----------
write("404.html", layout({ path: "/404.html", title: "Page not found | Chimexprime", description: "This page could not be found.", body: `<section class="section"><div class="wrap narrow center"><h1>Page not found</h1><p class="lede">The page you are looking for has moved or does not exist.</p><div class="btns" style="justify-content:center"><a class="btn btn-dark" href="/">Go to the homepage</a>${waBtn(WA_GENERAL, "WhatsApp Us", "btn btn-wa", "404")}</div></div></section>` }).replace("<head>", '<head>\n<meta name="robots" content="noindex">'));

// ---------- sitemap, robots, headers ----------
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${p.lastmod || today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`);
writeFileSync(join(DIST, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n`);
console.log(`Built ${pages.length} pages + 404 into dist/ for ${site.url}`);

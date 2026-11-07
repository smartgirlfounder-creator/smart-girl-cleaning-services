# Chimex Luxe Marble & Interiors: website

A fast, static, SEO-focused website for **CHIMEX LUXE MARBLE & INTERIORS** (Google Business Profile name: Chimexprime Global Ventures), Ajeromi-Ifelodun, Lagos.

- 20 pages: home, about, services hub + 8 service pages, project gallery, blog hub + 6 articles, contact, plus a 404 page
- WhatsApp on every page (header, hero, floating button, service pages, gallery photos, articles, contact form)
- LocalBusiness, Service, BlogPosting, BreadcrumbList, ImageGallery structured data
- XML sitemap, robots.txt, canonical URLs, Open Graph tags, responsive WebP images, lazy loading

Read **MISSING-INFO.md** before launch and **SEO-PLAN.md** for the keyword map and Google checklists.

## Edit content
| What | Where |
|---|---|
| Business details, domain, analytics IDs, Google profile link | `content/site.mjs` → `site` |
| Services (text, FAQs, photos, WhatsApp messages) | `content/site.mjs` → `services` |
| Reviews (genuine only) | `content/site.mjs` → `reviews` |
| Gallery photos and captions | `content/site.mjs` → `photos` |
| Blog articles | `content/articles/*.md` (copy an existing file, change the top section) |
| Design | `src/styles.css` |

### Add new photos
1. Put the original photos in a folder, named like `granite-kitchen-surulere.jpg`.
2. `node scripts/images.mjs path/to/folder` (creates WebP sizes in `src/assets/img`).
3. Add each photo to `photos` in `content/site.mjs` with an honest description.

## Build
```bash
npm install
npm run build     # builds dist/ and runs all checks (links, titles, WhatsApp links, images, schema)
```

## Deploy on Netlify
**Option A: drag and drop (simplest)**
1. Set `site.url` in `content/site.mjs` to the final address, then `npm run build`.
2. Go to app.netlify.com → Add new site → Deploy manually → drag the `dist` folder (or the zip of its contents).
3. Site configuration → Change site name (e.g. `chimexluxe` → https://chimexluxe.netlify.app).

**Option B: from Git**: Base directory `chimex-luxe-website`, build command `npm run build`, publish directory `chimex-luxe-website/dist`.

**Custom domain**: Domain management → Add domain → follow the DNS steps. HTTPS is automatic. Then update `site.url`, rebuild and redeploy.

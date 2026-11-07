# SEO plan: Chimex Luxe Marble & Interiors

## 1. Keyword-to-page map
| Page | Primary keyword | Secondary keywords | Search intent |
|---|---|---|---|
| `/` | marble countertops in Lagos | luxury kitchen countertops, marble granite quartz Lagos | Commercial: find a provider |
| `/services/marble-kitchen-countertops-lagos/` | marble kitchen countertops | kitchen marble tops, kitchen marble tops in Lagos, custom marble countertops | Commercial |
| `/services/granite-kitchen-countertops-lagos/` | granite kitchen countertops | granite kitchen tops in Lagos, granite countertop installation | Commercial |
| `/services/quartz-kitchen-countertops-lagos/` | quartz kitchen countertops | quartz countertops in Lagos, quartz countertop installation | Commercial |
| `/services/marble-slabs-stone-supply-lagos/` | marble slabs for sale | marble suppliers in Lagos, marble and granite suppliers in Nigeria | Transactional |
| `/services/kitchen-countertop-installation-lagos/` | kitchen countertop installation | kitchen countertop installers in Lagos, stone fabrication in Lagos | Commercial |
| `/services/marble-granite-installation-services-lagos/` | marble installation services | marble and granite installation, marble fabricators in Lagos | Commercial |
| `/services/bathroom-countertops-vanity-tops-lagos/` | marble bathroom countertops | vanity tops in Lagos | Commercial |
| `/services/granite-tombstones-lagos/` | granite tombstones in Lagos | custom granite tombstones, grave monuments | Commercial |
| `/our-work/` | marble countertop projects Lagos | kitchen countertop gallery | Trust/visual |
| `/blog/marble-vs-granite-kitchen-countertops-lagos/` | marble vs granite kitchen countertops | which is better for Nigerian kitchens | Informational |
| `/blog/how-much-do-marble-kitchen-countertops-cost-in-lagos/` | marble kitchen countertop cost Nigeria | price of kitchen marble top Lagos | Informational → commercial |
| `/blog/things-to-consider-before-buying-kitchen-marble-tops/` | kitchen marble tops | buying guide | Informational |
| `/blog/quartz-vs-marble-vs-granite-kitchen-countertops/` | quartz vs marble vs granite | best kitchen countertop material | Informational |
| `/blog/kitchen-countertop-installation-guide-lagos/` | kitchen countertop installation in Lagos | installation process | Informational → commercial |
| `/blog/how-to-clean-and-maintain-marble-kitchen-countertops/` | how to clean marble countertops | marble care | Informational |

## 2. Remaining articles (content calendar, 1 to 2 per month)
Write each only when you can add real value, ideally with your own project photos.
1. Where to Buy Quality Marble Slabs in Lagos → links to Stone Supply
2. How to Choose the Best Kitchen Countertop for a Luxury Home → Marble/Quartz
3. Why Granite Kitchen Countertops Are Popular in Nigerian Homes → Granite
4. What to Know Before Installing a Marble Kitchen Backsplash → Marble
5. How to Choose the Right Marble Supplier in Lagos → Stone Supply
6. Marble and Granite Bathroom Countertops: Design and Installation Guide → Bathroom
7. How Much Does Quartz Kitchen Countertop Installation Cost in Nigeria? → Quartz (cost factors, no invented prices)
8. Marble, Granite and Quartz: Understanding the Differences → all three (avoid overlap with the existing comparison: focus on how each is made)
9. How to Choose a Reliable Marble Installation Company in Lagos → Installation
Also strong: **project case studies** (one page per real job: area, material, photos, what was done).

## 3. Google Search Console setup
1. search.google.com/search-console → Add property → **Domain** (needs DNS) or **URL prefix** (use the HTML tag: paste the code into `site.gscVerification`, rebuild, deploy).
2. Submit `https://YOUR-DOMAIN/sitemap.xml` under Sitemaps.
3. URL Inspection → request indexing for the homepage and the 8 service pages.
4. Check Pages, Core Web Vitals and Enhancements (Breadcrumbs) weekly for the first month.
5. Performance → watch which queries bring clicks; strengthen those pages.

## 4. Google Business Profile: connect and optimise
**Connect:** Profile → Edit profile → Website → `https://YOUR-DOMAIN/?utm_source=google&utm_medium=organic&utm_campaign=gbp` (the UTM shows GBP traffic separately in GA4). Then paste the profile's share link into `site.googleBusinessUrl` and rebuild.

**Checklist**
- [ ] Business name matches real signage (see MISSING-INFO.md #1); don't add keywords to the name
- [ ] Primary category: the closest match among Google's categories (e.g. *Countertop store* or *Marble contractor*); secondary: *Granite supplier*, *Kitchen remodeler*, *Monument maker* (pick only what applies)
- [ ] Services list: add each service with a short description (copy from the website)
- [ ] Address/service area accurate; hours accurate (confirm "Open 24 hours")
- [ ] Phone +234 706 934 1675; WhatsApp enabled
- [ ] Photos: upload real project photos regularly (kitchens, fabrication, finished work); no stock images
- [ ] Posts: one update per completed project (photo + short description + link to the matching service page)
- [ ] Reviews: ask every satisfied client (use the profile's "Get more reviews" link); never buy or fake reviews; never offer incentives
- [ ] Reply to every review professionally, and mention the service naturally when relevant
- [ ] Q&A: add genuine common questions and answers
- [ ] Keep name, address and phone **identical** everywhere (website footer, Facebook, directories)

## 5. Citations (consistent name, address, phone)
Create or claim listings with the exact same NAP: Facebook Page, Instagram business profile, LinkedIn company page, Bing Places, Apple Business Connect, VConnect, Nigeria Business Directory (businesslist.com.ng), Finelib. Use the same description and website link on each.

## 6. Tracking
- Set `site.ga4Id` (GA4 Measurement ID) and rebuild. Events sent automatically: `whatsapp_click` (with location label: header, hero, floating, gallery, article…), `phone_click`, `generate_lead` (enquiry form).
- In GA4 mark `whatsapp_click`, `phone_click` and `generate_lead` as key events (conversions).
- GBP traffic appears as source `google`, campaign `gbp`.

## 7. Ongoing routine (monthly)
1. Upload 4 to 8 new project photos to the Google profile and the website gallery.
2. Publish 1 to 2 articles or case studies.
3. Ask every finished client for a Google review.
4. Check Search Console queries and improve the pages that appear but get few clicks.

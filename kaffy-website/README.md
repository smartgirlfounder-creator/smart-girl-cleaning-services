# kaffyolaitan.com

The personal brand website of Kaffy Olaitan: business educator, entrepreneur and public speaker.

## What's on the site

| Page | Address | What it's for |
|---|---|---|
| Home | `/` | The hook, the story, what Kaffy teaches, latest content |
| About | `/about/` | The full story, community outreach, milestones |
| Speaking | `/speaking/` | Six talk topics, biography, booking form |
| Podcast | `/podcast/` | Every episode gets its own page |
| Becoming Kaffy | `/becoming-kaffy/` | The documentary: one page per day, plus The Journey So Far |
| Articles | `/articles/` | The daily blog, with category pages |
| Media | `/media/` | Interviews and press |
| Gallery | `/gallery/` | Photos by category |
| Resources | `/resources/` | Tools, guides and courses |
| Work With Me | `/work-with-kaffy/` | Services |
| Contact | `/contact/` | Enquiry form by type |

Forms (speaking bookings, contact and the newsletter) are sent by FormSubmit (formsubmit.co) to the email in Site settings.

Hosting: GitHub Pages, published by `.github/workflows/kaffy-website.yml` on every change.

## How to post (from a phone or laptop)

1. Go to **kaffyolaitan.com/admin** and sign in with GitHub.
2. Choose what you're posting:
   - **Podcast episodes**: a new episode.
   - **Becoming Kaffy**: a new documentary day.
   - **Articles (blog)**: a new article.
3. Tap **New**, fill in the boxes, and paste the YouTube link if there is one.
4. Tap **Publish**. The page is live in about a minute.

To change the hero quote, your email, social links or the podcast name, open **Site settings and lists → Settings**.
Milestones, gallery photos, resources and speaking topics are edited from the same place.

## One-time setup (to do together)

1. **GitHub Pages**: repository Settings → Pages → Source: **GitHub Actions**. Custom domain: `kaffyolaitan.com`, then tick **Enforce HTTPS**.
2. **Namecheap → Advanced DNS** (leave Mail Settings, SPF, DKIM and the verification records alone):
   - A records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - CNAME `www` → `smartgirlfounder-creator.github.io`
3. **Forms**: send one test from each form, then click FormSubmit's activation email (sent once to the form email).
4. **Admin login**: uses the GitHub OAuth app installed on the Netlify project `kaffy-olaitan` (builds stopped, no credits used). Keep that Netlify project.
5. **Google**: Search Console property for `kaffyolaitan.com`, sitemap `https://kaffyolaitan.com/sitemap-index.xml`.

## For developers

- Astro 5, static output, content collections in `src/content/`, editable data in `src/data/`.
- Admin: Decap CMS (`public/admin/`), GitHub backend (login via Netlify's OAuth service), publishing straight to the default branch.
- `npm install`, then `npm run dev` to preview locally, or `npm run build` to build.

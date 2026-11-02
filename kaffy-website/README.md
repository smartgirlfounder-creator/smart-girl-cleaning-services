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

Forms (speaking bookings, contact and the newsletter) are handled by Netlify Forms and arrive by email.

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

1. **Netlify**: Add new site → Import from GitHub → this repository.
   - Base directory: `kaffy-website`
   - Build command: `npm run build`
   - Publish directory: `kaffy-website/dist`
   - Branch: `main`
2. **Forms**: Netlify → Forms → enable form detection, then add an email notification for each form.
3. **Admin login**:
   - Create a GitHub OAuth app with the callback URL `https://api.netlify.com/auth/done`.
   - In Netlify, go to Access & security → OAuth and install the GitHub provider with that app's ID and secret.
4. **Domain**: after buying kaffyolaitan.com, add it in Netlify → Domain management.
5. **Google**: add the site to Google Search Console and submit `sitemap-index.xml`.

## For developers

- Astro 5, static output, content collections in `src/content/`, editable data in `src/data/`.
- Admin: Decap CMS (`public/admin/`), GitHub backend, publishing straight to `main`.
- `npm install`, then `npm run dev` to preview locally, or `npm run build` to build.

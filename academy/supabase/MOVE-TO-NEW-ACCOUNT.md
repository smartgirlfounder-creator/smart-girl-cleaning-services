# Move the Academy database to Olaitan's Supabase account

**Why:** the first database (`zvwydtgdwqfggompansj`) was created in the organisation "keffyola.ko@gmail.com's Org", because that's the account the Claude Supabase connector was linked to at the time. Olaitan's own Supabase account is **smartgirlfounder@gmail.com**, and she can't open the keffyola account to change its settings. She has reconnected the Supabase connector to her own account. Recreate the database there.

The old project has no real users, so there is no data to copy.

## Steps for Claude

1. `list_organizations` and `list_projects`. Confirm the organisation belongs to smartgirlfounder@gmail.com. If it's still the keffyola org, stop and tell Olaitan the connector isn't switched yet. Her account also has a paused project, "smartgirlfounder@gmail.com's Project". Leave it alone.
2. Create a new free project named **Smart Cleaners Academy** in her organisation, region **eu-west-2** (London). Use `get_project` until it's healthy.
3. Apply the migrations in `academy/supabase/migrations/` in filename order, with `apply_migration` and the same names.
4. Run `get_advisors` for security. Expected: the "RLS enabled, no policy" info on `platform_admins` (intentional), and the RPC functions being callable by signed-in users (intentional: `create_organization`, `join_organization`, `regenerate_join_code`, `am_i_admin`, `admin_overview`). Nothing else.
5. Test the security rules inside the database. Use a `DO` block that creates test users in `auth.users` (owner, staff, outsider, and smartgirlfounder@gmail.com as admin), switches to `set local role authenticated` with `request.jwt.claims`, checks each rule, then ends with `raise exception` so everything rolls back. Then confirm `auth.users` is empty. Checks: owner creates a business; staff joins by code; staff saves an attempt; staff can't assign or change their email; an outsider can't write into the business or see any of it; the owner sees the team; the admin sees all accounts; the owner can't open `admin_overview`.
6. Get the project URL and the `sb_publishable_…` key with `get_project_url` / `get_publishable_keys`. Put them in `academy/src/cloud/config.ts`, and update the project id in `academy/supabase/README.md`.
7. From `academy/`, run `npm run typecheck`, `npm test`, `npm run build`, `node e2e/journey.mjs` and `npm run e2e:business`. Everything must pass.
8. Commit and push to the current branch. Netlify redeploys automatically if it's connected to that branch.
9. Tell Olaitan, in plain, simple steps:
   - Log in at supabase.com as smartgirlfounder@gmail.com, open **Smart Cleaners Academy**, go to **Authentication → Sign In / Providers → Email**, turn **Confirm email** off, and save.
   - Then, on her Netlify site, **Sign in → Create account** with **smartgirlfounder@gmail.com** first. That account becomes the Academy admin.
10. Ask whether the old keffyola project (`zvwydtgdwqfggompansj`) should be deleted. Only she, or whoever owns that account, can do it from that account.

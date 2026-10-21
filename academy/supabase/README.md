# Database (Supabase)

Project: **Smart Cleaners Academy** (`zvwydtgdwqfggompansj`, London, free plan).

The files in `migrations/` were applied to that project in order. They create:

- `profiles`: one per account (name, email, last seen), created automatically on sign-up.
- `organizations` + `memberships`: a business, its 6-character team code, and its owner and staff (one business per person).
- `assignments`: missions an owner assigns to the whole team or one person, with an optional due date.
- `attempts`: the training record, one row per finished mission.
- `platform_admins`: the Academy admin (smartgirlfounder@gmail.com), linked to the account when it signs up.

Row-level security means people see only their own records, owners see their own team, and only the admin sees everyone. Policy helper functions live in the non-API `private` schema. Business actions (create, join, new code, admin overview) are `security definer` functions that check the caller first.

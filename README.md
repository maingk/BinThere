# BinThere

*ToteNotes*

Know what's in the basement without opening a single lid.

Every plastic tote gets a printed QR label. Scan it with a phone camera and you
land on that tote's page — its name, its category, where it lives, and a list of
what's inside. Scan a label that hasn't been used yet and you get a registration
form instead.

## Stack

- **Next.js 16** (App Router, Server Actions) + TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **Supabase** — Postgres, magic-link auth, Storage, row-level security
- **qrcode** + **pdf-lib** for printable label sheets
- PWA manifest so it installs to a phone home screen; a Capacitor wrap can reuse
  this codebase for the native app later

## Data model

| Table | Purpose |
|---|---|
| `households` | One per family. Carries the invite code. |
| `profiles` | Links an auth user to a household. |
| `categories` | Holiday decorations, tableware, electronics, … |
| `totes` | A physical tote. `code` is what the QR label encodes. |
| `items` | Individual contents of a tote. |
| `tote_photos` | Storage-backed photos. Schema only — no UI yet. |

Every table is locked to the caller's household by RLS, resolved through the
`current_household_id()` helper.

### Tote lifecycle

1. **Mint** — `/labels` generates blank codes as `unclaimed` totes.
2. **Print** — `/api/labels` renders a PDF sheet, two labels per tote by default.
3. **Register** — scanning an unclaimed code opens `/register/[code]`; saving it
   assigns a size prefix, number and name, and flips it to `active`.
4. **Use** — scanning an active code jumps straight to `/totes/[id]`.

A tote's human label is `size_prefix` + `index_no`, rendered as `L-14`, and is
unique within a household.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev
```

The Supabase project `binthere` is already provisioned and all five migrations
in `supabase/migrations/` are applied. To stand up a fresh project, apply them
in order via the SQL editor or `supabase db push`.

### Supabase dashboard settings

These are not in the migrations and must be set once per project:

1. **Authentication → Providers → Email** — enable email, and turn on
   *Confirm email* / magic links. Passwords are not used.
2. **Authentication → URL Configuration → Redirect URLs** — add
   `http://localhost:3000/auth/callback` and the production equivalent.
   The magic link silently fails without this.
3. **Authentication → URL Configuration → Site URL** — set to the production
   origin.

## Security model

Every table has RLS on, scoped through `current_household_id()`. Verified
against the live database: a second household sees zero rows from the first,
including through `search_totes`.

`0005_harden.sql` revokes the default `PUBLIC` execute grant on every function,
because PostgREST publishes anything in `public` as an RPC endpoint. What stays
callable, and by whom:

| Function | anon | authenticated |
|---|---|---|
| `create_household`, `join_household`, `mint_tote_codes`, `next_tote_index`, `search_totes`, `current_household_id` | ✗ | ✓ |
| `gen_tote_code`, `touch_updated_at`, `touch_parent_tote` | ✗ | ✗ |

The Supabase linter still flags the six signed-in RPCs as `SECURITY DEFINER`
functions reachable by authenticated users. That is intentional — each one
validates its own caller — and is the accepted state, not an outstanding bug.

### Environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key |
| `NEXT_PUBLIC_APP_URL` | Origin baked into every QR label |

> `NEXT_PUBLIC_APP_URL` is encoded into printed labels. Set it to the production
> origin **before** printing anything, or the labels will point at localhost.

## Printing labels

`/labels` generates blank codes and opens a print-ready PDF. Sheet presets live
in `src/lib/labels.ts` and follow Avery's published dimensions — run one test
print on plain paper and hold it against your label stock before committing a
sheet. The `plain` preset draws cut lines for scissors-and-tape.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run db:types   # regenerate src/lib/database.types.ts from Supabase
```

Until `db:types` is run against a live project, `src/lib/database.types.ts` is
hand-authored to match the migrations. Keep the two in step.

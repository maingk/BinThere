# BinThere

*Notes for Your Totes*

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
| `households` | One per family. Carries the invite code and the URL slug. |
| `profiles` | Links an auth user to a household. |
| `categories` | Holiday decorations, tableware, electronics, … |
| `totes` | A physical tote, identified by its printed label. |
| `items` | Individual contents of a tote. |
| `tote_photos` | Storage-backed photos. Schema only — no UI yet. |

Every table is locked to the caller's household by RLS, resolved through the
`current_household_id()` helper.

### Identity

A tote is identified by the label printed on its sticker: size plus a sequence
number, rendered `27G-01`. There is no separate opaque code — the thing a
person reads off the lid, the thing the QR encodes, and the database key are
all the same value. That means a label is typeable, which is the fallback when
a sticker is damaged or a camera isn't handy.

`27G-01` is only unique within a household, so the QR URL carries the
household's slug: `/t/<slug>/27G-01`. Scanning another household's sticker
misses rather than silently resolving to your own tote of the same number.

**Only immutable facts are printed.** Size is a property of the physical tote
and never changes. Where a tote lives is a mutable `location` column, shown on
the tote page and searchable, because totes get moved and a sticker cannot be
updated to follow them.

`size_prefix` and `index_no` are set once, by `mint_totes()`, and no code path
updates them afterwards — the sticker is already on the lid.

### Tote lifecycle

1. **Reserve** — `/labels` calls `mint_totes('27G', 12)`, creating twelve
   `unclaimed` totes numbered on from your last 27G.
2. **Print** — `/api/labels` renders a PDF sheet, two labels per tote by default.
3. **Register** — scanning an unused label opens `/register/<slug>/27G-01`;
   saving records the contents and flips it to `active`.
4. **Use** — scanning a registered label jumps straight to `/totes/[id]`.

Typing a label into the lookup box on the home screen follows the same two
destinations, so it behaves identically to scanning.

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
| `create_household`, `join_household`, `mint_totes`, `next_tote_index`, `find_tote_by_label`, `search_totes`, `current_household_id` | ✗ | ✓ |
| `gen_household_slug`, `touch_updated_at`, `touch_parent_tote` | ✗ | ✗ |

The Supabase linter still flags the signed-in `SECURITY DEFINER` RPCs as
reachable by authenticated users. That is intentional — each one
validates its own caller — and is the accepted state, not an outstanding bug.

### Environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable anon key |
| `NEXT_PUBLIC_APP_URL` | Origin baked into every QR label |

> `NEXT_PUBLIC_APP_URL` is encoded into printed labels. Set it to the production
> origin **before** printing anything, or the labels will point at localhost.

## Testing from a phone

`npm run dev` binds to localhost, which a phone cannot reach — scanning a QR
label would resolve `localhost` to the phone itself. Use:

```bash
npm run dev:lan
```

It detects the Mac's LAN address, serves on it, and overrides
`NEXT_PUBLIC_APP_URL` for that run only, so QR codes encode an address the
phone can actually load. `.env.local` is left untouched. Override the detected
interface with `LAN_HOST=192.168.1.20 npm run dev:lan`.

Add the printed callback URL (e.g. `http://192.168.68.93:3000/auth/callback`)
to Supabase's Redirect URLs, or the magic link will bounce.

`next.config.ts` adds the machine's private IPs to `allowedDevOrigins`. Without
that, Next blocks cross-origin dev resources, React never hydrates, and forms
fall through to the browser's native submit — the page reloads and the input
vanishes with no error shown. It looks like the app is ignoring you.

Caveats: the address changes when DHCP reassigns it, and plain HTTP means
"Add to Home Screen" won't behave like a real PWA. **Never print labels from
this mode** — they would encode a private address that stops working. Deploy
first, then print.

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

# INVONAUT — War Room Checklist, Part 2

Fresh full audit — July 3, 2026. Continues numbering from the original
34-item War Room checklist (v4.1 Business Doc / v7.1 Context Doc). Tracked
in-repo per Kamo's decision (session of July 4, 2026); sequenced and fixed
by severity (Critical → High → Medium → Low → Info).

## Resolution status (as of July 4, 2026 session)

| # | Severity | Item | Status | Resolution |
|---|---|---|---|---|
| #35 | CRITICAL | `asset_review_tokens` RLS policy exposes the full table via anon key | ✅ Closed | Dropped the unused `public_read_by_token` policy via Supabase migration. Confirmed app never relied on it (service-role route bypasses RLS). |
| #36 | HIGH | 5 routes/cron doing tier-only subscription gating | ✅ Closed | `contracts/review`, `expenses/categorize`, `plaid/create-link-token`, `cron/budget-alerts`, `intelligence/refresh` all now require `isSubscriptionActive()`. |
| #37 | HIGH | `intelligence/refresh` re-triggers the cron platform-wide | ✅ Closed | Cron now accepts an optional `?userId=` to scope a run to one caller; the real scheduled cron call is unaffected. |
| #38 | MEDIUM | financial-intelligence cron subscriber filter misses trial-expiration | ✅ Closed | Switched to a post-fetch `isSubscriptionActive()` filter, matching the pattern already used in `weekly-time-summary`. |
| #39 | MEDIUM | Dead hook reproducing the old subscription-check bug | ✅ Closed | Deleted `src/hooks/use-subscription-status.ts` (zero live usages). |
| #40 | MEDIUM | UTC-midnight date bug unpatched in ~20+ locations | ✅ Closed | T12:00:00 fix applied everywhere on the documented list, plus 3 additional gaps found during the sweep (portal `formatDate` call sites, AI payment-prediction card, affiliate commission periods) that the original audit's grep pattern had missed. |
| #41 | LOW | Branding settings UI doesn't match enforcement | ✅ Closed | `settings-form.tsx` and `portal-settings-form.tsx` branding gates now also require `hasActiveSubscription`. |
| #42 | LOW | 5 duplicate `invoice-row.tsx`-family files | ✅ Closed | All 5 files were fully orphaned (zero live imports anywhere) — deleted rather than consolidated. The real invoice list uses `invoice-list.tsx`, unaffected. |
| #43 | INFO | 14 npm audit findings in transitive deps, reachability untraced | ✅ Closed | `npm audit fix` applied (non-breaking), cut 14 → 3. Full reachability trace on the remainder in `docs/checklist-43-npm-audit-reachability.md` — nothing reachable left unpatched. |

All 9 items closed in the July 4, 2026 session. Combined with Part 1
(34/34, Kamo confirmed the manual Postgres upgrade), the full War Room
checklist — Part 1 + Part 2 — is now 43/43.

---

## Original audit (unedited, for reference)

Verified live at session start, not assumed from the handoff doc:

- Local repo, GitHub main, and the latest Vercel production deployment
  (`dpl_5uN4kgqTFmLzey9cxqaEhE3KFS5Z`) all match commit `7a8dd2d`. No drift.
- Supabase project `xyncwrusetglyuawwwvv` — fresh `get_advisors` (security +
  performance) pulled directly, not reused from the last session.

### Status update on the two items carried over from Part 1

| # | Item | Status |
|---|---|---|
| #12 | Leaked-password protection | Still shows as WARN in the Supabase security advisor — expected, not a regression. The advisor only checks the native dashboard toggle, which stays Pro-gated; the code-level fix (commit `7a8dd2d`) isn't and can't be reflected there. #12 remains correctly closed via code. One follow-up still genuinely open: the code-level check has not yet been functionally tested end-to-end in a live browser — recommend Kamo try `password123` at signup/reset once. |
| #13 | Postgres version upgrade | Appears resolved. `SHOW server_version` returns 17.6 (previously flagged 17.4.1.075), and the security advisor no longer lists `vulnerable_postgres_version` at all. **Confirmed by Kamo (July 4 session): he ran the manual dashboard upgrade himself.** Part 1 is fully closed at 34/34. |

### #35 — CRITICAL — `asset_review_tokens` RLS policy exposes the entire table to the public, unconditionally

Where: Supabase table `public.asset_review_tokens`, RLS policy `public_read_by_token`

The Supabase performance advisor flagged this only as a "multiple
permissive policies" efficiency note, which understates it. Direct
inspection shows why it's a real security bug:

- Policy `public_read_by_token`: `cmd: SELECT`, `qual: true` — unconditionally
  true, granted to `public` role (covers `anon`).
- `anon` role has an explicit SELECT grant on the table (confirmed via
  `information_schema.role_table_grants`).

Net effect: anyone holding the public anon key (which ships in every page's
JS bundle by definition) can call the Supabase REST API directly — e.g.
`GET /rest/v1/asset_review_tokens?select=*` — and receive every row for
every user: token, reviewer_email, asset_id, user_id, expires_at, used_at.
This defeats the entire "magic link" model — no actual token needs to be
known or guessed, since the whole table can be dumped and harvested tokens
used directly against `/asset-review/[token]`.

Confirmed the app's own code doesn't even need this policy:
`src/app/api/assets/review/route.ts` correctly uses a service-role admin
client with its own `.eq('token', token)` + expiry + `used_at` checks,
entirely bypassing RLS as intended. The `public_read_by_token` policy
appears to be a leftover from an earlier (never-shipped, or
since-refactored-away) design where the client queried this table directly.
It currently provides zero functional benefit and is pure exposure.

### #36 — HIGH — Five more API/cron routes found doing tier-only subscription gating (continuing the #32/#33 sweep)

Commit `5e501a6` ("#32, partial") explicitly listed unaudited remainders —
send-invoice, download-invoice routes, contract-sign/portal-facing checks,
"the other ~10 of the original [25]." This session ran that sweep to
completion across every API route referencing `subscription_tier`. Five
genuine gaps found, all reproducing the same bug class #32/#33 were built to
close: a canceled Professional/Business user keeps tier-gated access
forever, because `subscription_tier` is intentionally preserved on
cancellation (per #33) and none of these five ever call
`isSubscriptionActive()`.

| Route | What it gates | Why it matters |
|---|---|---|
| `src/app/api/contracts/review/route.ts` | AI contract review (Pro+) | Real OpenAI spend, triggerable indefinitely by a canceled user |
| `src/app/api/intelligence/refresh/route.ts` | Manual "Refresh Intelligence Feed" button | Compounds with #37 — see next item, this one's worse than it looks |
| `src/app/api/expenses/categorize/route.ts` | AI expense categorization (Pro+) | Real OpenAI spend, triggerable indefinitely by a canceled user |
| `src/app/api/plaid/create-link-token/route.ts` | Bank account connection limit (1 Starter / 3 Pro / unlimited Business) | Zero cost today (Plaid sandbox), becomes real usage-based cost at Plaid production pricing |
| `src/app/api/cron/budget-alerts/route.ts` | Daily Business-tier budget overspend alerts | Canceled Business users keep receiving these emails forever (checks `!== 'business'` only, no status check) |

Two adjacent routes were checked and found to have a presence-based guard
rather than the canonical active-check, lower severity than the five above
but worth including for completeness —
`src/app/api/downgrade-subscription/route.ts` (checks `stripe_subscription_id`
exists, not that the subscription is genuinely active) and
`src/app/api/cancel-subscription/route.ts` (intentionally preserves tier by
design per its own comment — not a bug, listed here only so it isn't
mistaken for an unreviewed gap).

### #37 — HIGH — `intelligence/refresh` doesn't scope to one user — it re-triggers the entire daily cron system-wide

Beyond the tier-only gap in #36, `src/app/api/intelligence/refresh/route.ts`
calls `GET /api/cron/financial-intelligence` with no user-scoping parameter,
and that cron route has no `searchParams` handling to target a single user.
Any single click of "Refresh" by any one user re-runs full AI intelligence
generation for every Professional/Business subscriber on the platform, not
just the clicker. Combined with #36's tier-only gate, this means even a
canceled user hitting this endpoint doesn't just get free intelligence for
themselves — they trigger a fleet-wide OpenAI spend event on demand, with no
rate-limiting evident in the route.

### #38 — MEDIUM — financial-intelligence cron's own subscriber filter still misses the trial-expiration case it was built to fix

`src/app/api/cron/financial-intelligence/route.ts` filters subscribers with
`.in('subscription_status', ['active', 'trialing'])`. This is the fix from
commit `46dfcb6`, and it's a real improvement over the original `= 'active'`
-only filter — but it still never checks `trial_end_date` against `now()`.
This is the exact gap `isSubscriptionActive()` exists to close (the
historical incident: 8 real accounts stuck on 'trialing' with
`trial_end_date` 3-4 months in the past, still getting full access). Because
this specific check lives inside a Supabase query filter rather than app
code, it can't just import the existing utility — it needs either a
SQL-level `trial_end_date > now()` condition added to the query, or a
post-fetch filter pass using `isSubscriptionActive()`. Same risk shape as
#36's OpenAI-cost items, but firing autonomously and daily rather than
requiring user action, which arguably makes it worse.

### #39 — MEDIUM — Dead code reproducing the exact pre-fix subscription bug, left in the codebase

`src/hooks/use-subscription-status.ts` — confirmed zero live usages anywhere
in `src/` (not dead by omission, verified by direct grep). Its logic is a
verbatim copy of the old buggy pattern the `isSubscriptionActive()` refactor
(commits `12fad96` → `dde1bbb`) was built to eliminate:

```
const isSubscribed = !!profile?.stripe_subscription_id &&
  (profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing')
```

No `trial_end_date` check at all — this is the identical expression the
doc's own commit history describes converting at "25 call sites" and
confirming "zero remaining inline copies" via grep sweep. This file just
wasn't caught, likely because it's unused and grep sweeps targeting active
call sites wouldn't have prioritized checking unused hooks. Not currently
exploitable (nothing imports it), but it's a named, documented-sounding hook
(`useSubscriptionStatus`, with a JSDoc comment describing it as the way to
check subscription status) sitting in the codebase ready to be picked up by
a future session or contributor who reasonably assumes it's the canonical
utility. Recommend deleting it outright rather than fixing it, given
`subscription-status.ts` already does this correctly.

### #40 — MEDIUM — The T12:00:00 UTC-midnight date fix was applied to one call site; the same raw pattern exists in ~20+ others

The Context Doc documents this as a known, previously-fixed bug class, with
the fix pattern living in `src/lib/utils/invoice-status.ts`'s
`getInvoiceDisplayStatus()`. Checked live: that one function is correctly
patched. But the identical anti-pattern — `new Date(dateColumn)` on a column
confirmed via `information_schema` to be Postgres `DATE` type (no
time/zone component) — appears unpatched in many other places. In Kamo's
timezone (US, negative UTC offset), this shifts the displayed or computed
day backward by one for any of these columns: `invoices.due_date`,
`invoices.issue_date`, `contracts.expiry_date`, `contracts.start_date`,
`contracts.end_date`, `assets.purchase_date`, `direct_payments.payment_date`,
`payments.payment_date`, `expenses.date`, `bank_transactions.date`,
`affiliate_commissions.period_start` / `period_end`.

Confirmed not an issue (safe, `TIMESTAMPTZ` columns, no fix needed):
`trial_end_date`, `signed_at`, `created_at`, `started_at`, `requested_at`,
`signup_date`, Stripe Unix-timestamp fields in the webhook handler.

Grouped by why it matters, worst first:

Feeds the AI risk-scoring engine itself (not just display — this affects
the actual `ai_risk_score` shown on every invoice and the
predicted-payment-date shown in the Risk panel):

- `src/lib/ai/payment-predictions.ts:55,56,83,139,156`
  (`inv.issue_date`, `inv.due_date`, `invoice.due_date` ×2,
  `invoice.issue_date`)

Cron logic — affects actual day-boundary calculations, not just what's
shown:

- `src/app/api/cron/contract-reminders/route.ts:95` — feeds the
  30/15/7/1-day expiry warning logic and the auto-expire decision
- `src/app/api/cron/financial-intelligence/route.ts:90,106,107` — feeds the
  30/60-day window filtering for revenue-reliability and spending-spike
  detection

Dashboard logic — day-count badges, not just static display:

- `src/app/dashboard/page.tsx:155` (`c.expiry_date`)
- `src/app/dashboard/contracts/page.tsx:68` — direct
  `getTime() - Date.now()` day-count math on `end_date`

Client-facing (portal, emails, PDFs) — what an actual paying customer's
client sees:

- `src/app/portal/[slug]/invoices/[id]/page.tsx:36`,
  `src/app/portal/[slug]/page.tsx:35`
- `src/app/api/follow-up-invoice/route.ts:28,125`
- `src/lib/email/invoice-email-template.ts:40,165`
- `src/lib/email/contract-reminder-email-template.ts:11,146`
- `src/lib/pdf/generate-invoice-pdf.ts:186,187`

Component-level display only:

- `src/components/invoices/invoice-row.tsx:46`,
  `src/components/invoice-row.tsx:46` (duplicate file — see #42),
  `src/components/contracts/contract-actions.tsx:203`

> **Session update:** three more instances of this exact bug were found
> while fixing the above (missed by the original grep pattern, which only
> caught the `getDisplayStatus`-style comparison, not generic `formatDate`
> helper call sites): the portal's `formatDate()` calls on
> `issue_date`/`due_date`/`start_date`/`end_date`, the AI Payment Prediction
> card's re-parse of its own server-computed `predictedDate`, and the
> affiliate dashboard's `fmtDate()` call on commission `period_start`/
> `period_end`. All fixed in the same pass — see resolution table above.

### #41 — LOW — Branding settings UI doesn't match the enforcement it's supposed to reflect

`src/components/settings/settings-form.tsx:416` and
`src/components/portal/portal-settings-form.tsx:276` both gate the
white-label branding editor UI on a locally-computed
`isPro = tier === 'professional' || tier === 'business'`, not combined with
`hasActiveSubscription` — even though `hasActiveSubscription` is already an
available prop in `settings-form.tsx` specifically (line 321 uses it
correctly for something else in the same file). A canceled Pro/Business
user sees the full editable logo/color form instead of the upgrade-lock
screen.

Not a live security bypass — the actual enforcement (API routes, portal
rendering) was already correctly fixed in #32 and still checks
`isSubscriptionActive()` — so any edits this user makes are cosmetic dead
ends that never render anywhere client-facing. But it's a real
inconsistency with the pattern established everywhere else, and confusing
UX (a canceled user is told they can configure a feature they can't
actually use).

### #42 — LOW — Four separately-maintained files named invoice-row(-dashboard).tsx

`src/components/invoices/invoice-row.tsx`, `src/components/invoice-row.tsx`,
`src/components/dashboard/invoice-row.tsx`,
`src/components/dashboard/invoice-row-dashboard.tsx`, plus
`src/app/dashboard/invoices/invoice-row.tsx` — five files total,
near-identical purpose (render one invoice row with a formatted due date),
each with its own inline date-formatting logic. Not a bug by itself, but
it's exactly why #40 is spread across so many locations — any date-parsing
fix has to be manually repeated in every one of these rather than applied
once. Worth a consolidation pass whenever #40 gets addressed.

> **Session update:** consolidation turned out to be unnecessary — all five
> files were confirmed fully orphaned (zero live imports anywhere), so they
> were deleted outright rather than merged. See resolution table above.

### #43 — INFO — `npm audit --production`: 14 vulnerabilities in transitive dependencies (9 moderate, 5 high)

None of the flagged packages (`ws`, `form-data`, `glob`, `minimatch`,
`picomatch`, `yaml`, `qs`, `dompurify`, `svix` via `resend`, `uuid`,
`brace-expansion`) are direct dependencies in `package.json` — all are
transitive, and none are marked dev in the lockfile (which is why
`--production` surfaces them). That means npm's classifier considers them
production-reachable, but actual runtime-reachability inside the deployed
Vercel serverless bundle hasn't been traced — several of these (`glob`,
`minimatch`, `picomatch`) are commonly build-tool-only dependencies that may
never execute in a live request. `npm audit fix` reports non-breaking fixes
available for everything except the `next`/`postcss` pair, which needs a
semver-major bump. Recommend a proper reachability trace (same rigor as the
original jsPDF fix, #5) before deciding what to patch.

> **Session update:** full reachability trace completed — see
> `docs/checklist-43-npm-audit-reachability.md`. Applied the non-breaking
> `npm audit fix` (14 → 3 remaining). The 3 left (`glob` CLI flag, `next`'s
> vendored `postcss`) are confirmed build-tooling-only in this app's actual
> usage and don't warrant a risky override or a Next.js downgrade to
> mechanically silence.

### Confirmed clean — no regression found

Re-verified fresh rather than trusted from the handoff doc, per the doc's
own "always re-run the query" principle:

- FK/index coverage: zero foreign keys without a covering index (direct SQL
  query against `pg_constraint`/`pg_index`, not a re-quote of the "21 FKs"
  count)
- RLS `auth.uid()` InitPlan optimization: 0 bare `auth.uid()` calls, 58
  correctly wrapped in `(select auth.uid())`, across all public schema
  policies
- Embedded PostgREST join syntax (`clients(name)` style, 6 usage sites): all
  six correctly normalize the array/object join shape immediately after the
  query — no silent-failure risk
- Stripe webhook metadata key handling: confirmed genuinely consistent, not
  a regression — the subscription-checkout flow sets and reads
  `metadata.userId` (camelCase) consistently throughout; the separate
  portal-invoice-payment flow sets and reads `metadata.user_id` (snake_case)
  consistently throughout. Two different conventions across two independent
  flows, but no set/read mismatch in either. The Context Doc's phrasing
  ("webhook handlers correctly use `user_id`... was `userId`") is imprecise
  about which convention is actually in play, but the underlying claim — no
  functional bug — holds.
- Known-bug regression sweep: zero hits for `ai_days_to_pay` (the documented
  trap column), `fmtK(` (deleted utility), module-level `new OpenAI()` (all
  4 real call sites correctly lazy-initialized inside `getOpenAI()`), DM
  Mono references, and banned purple-/indigo-/violet- Tailwind classes

# Checklist #43 — npm audit reachability trace

**Status: closed.** Applied all available non-breaking fixes; traced runtime
reachability for everything else. Nothing found that's both reachable and
unpatched.

## Before

`npm audit --production`: 14 vulnerabilities (9 moderate, 5 high), all in
transitive dependencies — none are direct `package.json` entries.

## Action taken

Ran `npm audit fix` (non-breaking only, no `--force`). This bumped the
resolved versions of `qs`, `uuid` (and its `svix`/`resend` chain), `ws`, and
`yaml` in `package-lock.json`. `package.json` itself is unchanged — these are
all transitive pins. Verified clean after: `npx tsc --noEmit` and
`npm run build` both pass with no errors.

## After

`npm audit --production`: 3 vulnerabilities (2 moderate, 1 high) remain, both
require a decision rather than a mechanical fix:

| Package | Issue | Why it wasn't auto-fixed |
|---|---|---|
| `glob` 10.2.0–10.4.5 | CLI command injection via `-c`/`--cmd` (GHSA-5j98-mcp5-4vw2) | `npm audit fix` reports a fix is available but does not actually resolve it — pinned by `tailwindcss` → `sucrase`'s dependency range. Would need a manual `overrides` entry in `package.json` to force a newer `glob`, which risks breaking `sucrase`'s resolution. |
| `postcss` <8.5.10 (and `next`, listed separately since it vendors its own copy) | XSS via unescaped `</style>` in stringify output (GHSA-qx2v-qp2m-jg93) | Only resolvable via `npm audit fix --force`, which downgrades `next` to `9.3.3` — a multi-major-version downgrade of the framework itself. Not something to do without your explicit sign-off. |

Recommend leaving both as-is for now — see reachability trace below for why
neither is realistically exploitable in this app's deployed form — and
revisiting `next`'s postcss pin naturally whenever `next` itself gets its
next routine upgrade (Next.js has fixed this in their own dependency tree in
newer releases; no need to force it separately).

## Reachability trace (why the rest don't need action)

Traced actual usage in `src/`, not just the dependency graph, for every
package `npm audit fix` couldn't or didn't change:

| Package | Pulled in by | Vulnerable code path | Reachable here? |
|---|---|---|---|
| `dompurify` | `jspdf` (direct dep, used in `lib/pdf/generate-invoice-pdf.ts`) | Only triggers via jsPDF's `.html()` method (sanitizes HTML before rendering) | **No.** Checked every `doc.*(` call in `generate-invoice-pdf.ts` — only primitive drawing calls (`text`, `line`, `rect`, `addImage`, etc.). `.html()` is never called. |
| `form-data` | `plaid` → `axios` (direct dep, live bank connectivity) | CRLF injection via unescaped multipart field names/filenames | **No.** Plaid's API is JSON-only for every endpoint this app calls (link-token creation, item exchange, sync). Grepped for `FormData`/`multipart` in `lib/plaid/` and `api/plaid/` — zero hits. `form-data`'s multipart-encoding code path is never invoked. |
| `qs` | `stripe` (direct dep, billing) | DoS via `qs.stringify` crashing on null/undefined entries in comma-format arrays with `encodeValuesOnly` set; separately, an `arrayLimit` bypass in parsing | **Technically reachable, practically very low risk.** Stripe's SDK uses `qs` to serialize *outgoing* request params for every API call, so the package does execute on every Stripe call this app makes. But the crash conditions are specific edge cases in how Stripe's SDK itself calls `qs.stringify` internally, not something this app's own code controls directly — no user-facing input path lets a customer choose `qs`'s `encodeValuesOnly` option or otherwise reach the buggy branch. |
| `ws` | `@supabase/supabase-js` → `@supabase/realtime-js`, and `openai` (both direct deps) | Uninitialized memory disclosure + memory exhaustion DoS, both require an actual WebSocket connection receiving attacker-controlled frames | **No.** Grepped for `.channel(`, `postgres_changes`, `.subscribe(` (Supabase Realtime) and any OpenAI streaming/realtime usage in `lib/ai/` — zero hits. This app only uses Supabase's REST/PostgREST interface and OpenAI's plain chat-completions calls. `ws` is bundled but never opens a socket. |
| `svix` / `uuid` | `resend` (direct dep, transactional email) | `svix` verifies inbound webhook signatures; `uuid`'s bug requires an explicit pre-allocated buffer argument | **No.** This app only *sends* email via Resend (`resend.emails.send(...)`) — grepped for any Resend webhook handling anywhere in `src/`, found none. `svix`'s verification code, and therefore its `uuid` call, is never invoked. |
| `glob`, `minimatch`, `picomatch`, `brace-expansion`, `yaml` | `eslint`, `eslint-config-next`, `tailwindcss` (via `sucrase`, `chokidar`, `postcss-load-config`) | Various ReDoS / command-injection issues in file-globbing and YAML-parsing | **No.** All of these are build-time tooling (lint + Tailwind's CSS compilation during `next build`), operating only on this repo's own known file paths and config, never on live request input. They don't ship in the deployed Vercel serverless bundle's request-handling code. |
| `postcss` / `next` | `next` (direct dep) — vendors its own internal `postcss@8.4.31` | XSS via unescaped `</style>` when stringifying attacker-influenced CSS | **No.** `postcss` is never imported anywhere in `src/` (confirmed by grep) — only used via `postcss.config.mjs`, consumed exclusively by the build pipeline to compile this app's own static Tailwind stylesheet. No runtime code path processes user-supplied CSS. |

## Bottom line

Nothing currently reachable in the live app is unpatched. The two remaining
audit entries (`glob` CLI flag, `next`'s vendored `postcss`) are both
build-tooling-only in this app's actual usage, and both would require either
a risky manual dependency override or a major-version downgrade of Next.js
to silence mechanically — not worth doing for advisories that don't apply to
how this app actually uses either package.

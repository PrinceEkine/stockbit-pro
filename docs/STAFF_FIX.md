# Staff Calc/Adding Investigation + Fixes

Date: 2026-10-29
Report: "staff calc and adding seems not to be working properly."

## What was checked and cleared (code logic is consistent)

- Seat count: client (`staff` filtered by `role === 'staff'`, Settings.tsx)
  matches server (`accept/create_staff_invite` count the same rows).
- Plan limits: `constants/plans.ts` (beta 3 / mega 8 / mega_pro ∞) matches the
  SQL `staff_limit_for()` function exactly.
- RLS: owner can select/update their staff rows; staff can see their owner;
  the update trigger allows owner-detach for "remove staff".
- Billing: `verify-payment` sets `is_subscribed` + `plan` + expiry together,
  so paid limits resolve correctly on next login.
- Auth UI: register-with-invite-code flow (validation, live preview, metadata
  handoff, first-login redeem) is wired end to end.
- No drift between `supabase/sql/*.sql` sources and the `supabase/migrations/*`
  files for security/staff-invites.

## Most likely root cause: production never received the staff migrations

`supabase/migrations/20260830000001_schema.sql` ended with three
non-idempotent statements (`ALTER PUBLICATION ... ADD TABLE`). If any table
was already in the realtime publication, that migration fails and `db push`
aborts — so migrations `...02` (RLS), `...03` (staff invites) and `...04`
(admin) are never installed in production. Without `...03`, creating and
redeeming invites fails; without `...02`, the roster queries misbehave.
(The prior `supabase/sql/diagnostics.sql` already suspected this abort.)

I cannot reach production from here, so confirm with diagnostics §1 (below).

## Fixes in this change

| # | File(s) | Fix |
|---|---------|-----|
| 1 | `supabase/sql/schema.sql`, `supabase/migrations/20260830000001_schema.sql` (kept identical) | Publication adds are now idempotent (membership-checked `DO` block), so `db push` cannot abort midway and strand later migrations. Safe whether or not `...01` already applied (applied migrations are not re-run). |
| 2 | `supabase/migrations/20261029000001_invite_preview_limit.sql` (**new**) + mirrored in `supabase/sql/staff_invites.sql` | `preview_staff_invite()` now reports a full team. Before, it blessed codes for businesses at their staff limit and the joiner only failed AFTER signing up. |
| 3 | `store.ts` `removeStaffMember` | Now verifies a row was actually updated (`.select('id')` + empty check). Before, a no-op update looked like success and desynced the roster until refresh. |

## Owner actions

1. Supabase Dashboard → SQL Editor → run `supabase/sql/diagnostics.sql` §1.
   If versions `20260830000002…4` (or `20261015…`) are missing, that confirms
   the aborted push.
2. `npx supabase login` once, then `npm run deploy:supabase` to apply
   everything, including the new preview-limit migration.
3. Retest: Settings → Workforce → invite a teammate; join from a second
   account; remove them; confirm the `X / N seats used` counter moves.

## Verification (this machine)

- `npm run lint` (`tsc --noEmit`): PASS, exit 0, 2026-10-29.
- `npm run build`: PASS, exit 0, 2026-10-29 (only pre-existing
  Tailwind-ambiguity and chunk-size warnings).
- SQL: not executed here (no database on this machine); statements are
  standard Postgres, mirrored from the existing idempotent style in the repo.

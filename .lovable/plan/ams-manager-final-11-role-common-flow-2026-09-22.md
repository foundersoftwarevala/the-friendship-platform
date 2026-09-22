# AMS Manager — final 11-role common flow

## Goal
Build one real, role-isolated AMS pipeline for exactly these AMS roles: User, Reseller, Franchise, Author, Vendor, Affiliate, Influencer, Developer, Creator, SEO, Support.

“AMS Manager” remains the central management interface, not an AMS role. Existing Software Vala platform roles such as admin or founder remain untouched for login and permissions, but they never appear as AMS progression roles.

## Build plan

1. **Unify the AMS role catalogue**
   - Make one canonical 11-role definition used by role screens, filters, themes, stages, trophies, badges, certificates, passports, vaults, and tests.
   - Remove Manager, Administrator, Founder, and Operator only from AMS progression/catalogue surfaces; preserve existing platform RBAC and unrelated modules.
   - Give every valid role exactly 10 professionally named stages, including the supplied Developer and Reseller terminology.

2. **Apply the missing common-flow database foundation**
   - Additive migration only; do not delete or overwrite production data.
   - Complete role stages, role-scoped progression state, achievement state/verification, event ledger, XP history, recognition mappings, certificates, passports, vault records, and legacy history.
   - Add explicit grants and row policies for every new table.
   - Keep AMS configuration separate from user roles and controlled by the existing server-verified platform permissions.

3. **Complete the real event bridge**
   - Repair and apply the prepared event engine that is currently present in source but absent from the live database.
   - Connect only verified state changes from existing business records: purchases/usage/contributions, sales/customers/revenue, franchise growth, approved publishing, product/listing/sales activity, referrals/conversions, campaigns, releases, creator work, SEO work, and resolved support tickets.
   - Where a reliable source record does not yet exist, add a typed integration endpoint/record structure without inventing activity or awarding XP.
   - Keep ingestion idempotent and evaluation separate from UI clicks.

4. **Implement the complete progression pipeline**
   - Process event → matching role rule → achievement progress/state → XP transaction → level → stage → rank → configured recognition.
   - Persist source event, rule, role, achievement, timestamp, verification state, and awarded XP.
   - Support LOCKED, IN_PROGRESS, AVAILABLE, EARNED, VERIFIED, and REVOKED states; future stages stay locked.
   - Support multi-role users through separate per-user, per-role progression while reusing the existing identity and permission model.

5. **Configure role-specific recognition**
   - Map only configured assets to achievements; do not grant every asset at every stage.
   - Use distinct professional trophy, badge, medal, and award families per role and stage.
   - Preserve the existing Software Vala visual system and real logo assets; remove generic/static ownership claims.

6. **Make certificates and digital passports real**
   - Issue certificates only from verified earned achievements and persist recipient, role, achievement, level, ID, issue date, signature, QR verification, seal, and status.
   - Issue one persistent passport per eligible user-role, evolving Foundation → Professional → Elite → Legend → Legacy from real standing.
   - Replace role-only hash verification with database-backed lookup, revocation, and status checks.

7. **Connect every collection and vault screen**
   - Replace static “everything owned” galleries with the signed-in user’s earned, available, in-progress, and locked states.
   - Preserve all existing screens and artwork while attaching source achievement, role, stage, earned date, and verification.
   - Add a unified personal journey/history view sourced from the immutable AMS ledger.

8. **Connect AMS Manager configuration**
   - Make roles, stages, achievements, rules, XP, ranks, recognition mappings, certificate/passport settings, visibility, and history editable through the existing AMS Manager shell.
   - Use the existing authentication, permissions, sidebar, dashboards, database, and server functions; create no duplicate login, sidebar, or role system.

9. **Remove fake reward paths without removing features**
   - Remove frontend-only/manual XP awards, random “XP granted” messaging, deterministic fake credentials, mock stores, placeholder APIs, and role-static ownership.
   - Convert affected actions to real reads/actions or honest unavailable/locked states backed by missing-integration records.

10. **End-to-end verification**
   - Test all 11 roles, multi-role isolation, event deduplication, rule matching, state transitions, XP/level/rank updates, configured recognition, certificate/passport verification, vault persistence, and central configuration.
   - Verify live login/session reuse and browser flows at desktop sizes 1366×768 through 2560×1440, tablet, and mobile; check overflow, cropping, broken assets, overlaps, and navigation.
   - Run targeted database, server-function, unit, and browser tests with real persisted state and no seeded earned progress.

## Technical boundaries
- This phase does not perform enterprise hardening, penetration testing, anti-cheat redesign, distributed locking, performance redesign, or observability redesign.
- Existing platform roles remain for access control; “exactly 11 roles” applies to AMS progression, catalogues, filters, events, assets, and user AMS state.
- Catalogue/configuration records are allowed and required; earned user data is never seeded or fabricated.
- Existing features and production records remain intact; all schema work is additive.

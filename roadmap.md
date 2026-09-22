# Roadmap

## Sapphire marketplace homepage

- [x] Refine existing product cards, 3D actions, compact metrics, and responsive row spacing without changing behavior
- [x] Replace only the public `/` homepage with the sapphire-control-hub homepage UI
- [x] Keep the existing Control Panel and all other routes unchanged
- [x] Verify desktop and mobile visual parity in the live preview
- [x] Connect and emphasize the homepage Login action with accessible motion
- [x] Convert every product category into a Netflix-style 80-card carousel row
- [ ] Fill all 80-card rows with real catalogue products and open product details from category cards
- [x] Add visible Coming Soon actions, full sharing options, and fixed $249 lifetime pricing to every homepage product card

## Chat ecosystem (Connect Hub + Connect AI Assistant)

- [x] Chat database foundation (conversations, participants, messages, handoffs, RLS)
- [x] User-side chat app at /chat (real auth, realtime, attachments)
- [x] Real AI replies + human handoff server functions
- [x] Chat Manager console at /chat-manager + Control Panel entry
- [x] Chat launch button on every role dashboard top bar
- [x] Backfill roles/profiles so existing accounts can create conversations
- [ ] Role-specific chat dashboard inside each dashboard (Franchise, Reseller, SEO, Sales & Support and other roles see their own chat feed)
- [ ] Full end-to-end verification: real message -> real AI reply -> manager console -> handoff -> agent reply

## AMS Manager integration

- [x] Port reference AMS schema additively (41 tables, enums, RLS, grants, triggers)
- [x] AMS ticketing + chat tables with participant-scoped policies
- [x] is_admin() bound to existing Software Vala roles; signup hook seeds XP rows
- [x] Seed AMS catalogue content (levels, ranks, XP sources/rules, categories, achievements, badge collections, badges, trophies, leaderboards, missions, rewards, notification templates)
- [x] Control Panel -> AMS Manager opens the module at /ams; every AMS page returns 200
- [x] AMS Manager route parity with the reference module (79/79 pages mapped, all render 200; /ams redirects to /ams/overview)
- [x] Shared button supports the AMS sound/loading/compact-icon options — AMS module is TypeScript-clean
- [x] End-to-end signed-in verification of AMS pages (12 key screens load signed-in, zero console errors)
- [x] Full reference port: components/ams, lib/ams (Role DNA engine, museum, showcases, effects, sound), hooks, vault/showcase/progression routes
- [x] AMS unit + e2e suites pass (72/72 via vitest)
- [x] Full-repo parity sweep: components/ams + lib/ams byte-identical to reference (only /ams path prefixes differ), 78/78 reference routes mapped, nav parity, all reference DB objects present
- [x] Public QR credential verification page (/verify/$code) ported in full — passports and certificates, live-verified

## Module navigation + auth tests (current)

- [x] Global "Back to Control Panel" chip on every gated module (RouteAccessGate)
- [x] Back button inside CreatorSidebar, above the module search box (per user: sidebar top, not floating/top-bar); verified click → /control-panel
- [x] Harden password login against session races and route super-admin/operator roles deterministically
- [ ] Automated tests: login, super-admin access, affiliate routes, role redirects, invalid paths
- [ ] Pre-existing type backlog (~4.7k errors in ported modules, stale DB types) — tracked, not introduced by these changes

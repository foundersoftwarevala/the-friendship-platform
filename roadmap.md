# Roadmap

## Sapphire marketplace homepage
- [x] Replace only the public `/` homepage with the sapphire-control-hub homepage UI
- [x] Keep the existing Control Panel and all other routes unchanged
- [ ] Verify desktop and mobile visual parity in the live preview

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
- [ ] End-to-end signed-in verification of AMS CRUD flows — BLOCKED: the backend has zero accounts, so no session can be minted. Needs one sign-up in the preview first.

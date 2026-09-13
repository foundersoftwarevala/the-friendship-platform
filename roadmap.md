# Roadmap

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
- [ ] Seed AMS catalogue content (achievements, badges, levels, ranks) with real data
- [ ] End-to-end signed-in verification of AMS CRUD flows

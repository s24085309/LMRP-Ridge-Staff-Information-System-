# Ridge Oasis — One-stop Administrative Staff Information System

Internal staff knowledge base, document library and information-request
system for Ridge Oasis. Built with Next.js (App Router), Prisma + SQLite,
and NextAuth (Microsoft/Entra ID-ready).

## Status: Phase 1 + core of Phase 2

Implemented so far:

- Login screen ("Sign in with Microsoft" placeholder + temporary dev sign-in
  until the school's IT admin provides an Entra ID app registration)
- Dashboard: search hero, quick access categories, quote of the day / fun
  fact sticky notes, favourites, new/recently viewed resources, "Can't find
  what you're looking for?" prompt
- Configurable left navigation driven by the `Category` table
- Fuzzy/synonym-aware search with relevance ranking, best-matches vs.
  related-matches sections, and a no-results experience
- Resource pages with favourite/email/copy-link/print/download actions,
  related resources, and "Report an Issue" link
- Category pages
- Submit Information form → creates a Draft/Awaiting Approval resource
- Admin dashboard: stats, pending submissions queue, information requests
  queue
- Review screen: Approve & Publish / Return to Author / Reject, with audit
  log + notification on each decision
- Information Requests: staff can request info (auto pre-filled from a
  no-results search), and admins can convert a request into a draft
  resource in one click
- Role-based access (STAFF / CONTENT_MANAGER / ADMINISTRATOR / SUPER_ADMIN)

Not yet built (flagged as "Coming Soon" in the UI where relevant): file
upload/attachments UI, version history UI, review-date dashboards,
notifications UI, category-specific permissions, full admin settings
(branding/synonyms/quotes management UI), search analytics dashboards,
Microsoft Entra ID wiring (architecture is in place — see below).

## Getting started

```bash
npm install
npx prisma migrate dev
npm run dev
```

Visit http://localhost:3000. Use the temporary dev sign-in with
`admin@ridgeoasis.school` (Super Admin) or `staff@ridgeoasis.school` (Staff)
— these are seeded by `prisma/seed.ts`.

## Microsoft / Entra ID sign-in

The auth architecture (`src/auth.ts`) is written for
`next-auth`'s Microsoft Entra ID provider. Once the school's IT
administrator creates an App Registration, set these in `.env`:

```
AUTH_MICROSOFT_ENTRA_ID_ID=...
AUTH_MICROSOFT_ENTRA_ID_SECRET=...
AUTH_MICROSOFT_ENTRA_ID_ISSUER=...
```

The "Sign in with Microsoft" button activates automatically and the
temporary dev credentials provider should then be removed from
`src/auth.ts`.

## Tech stack

- Next.js 16 (App Router, Server Actions)
- Prisma 6 + SQLite (swap the `datasource` in `prisma/schema.prisma` for
  Postgres/MySQL when moving beyond a single-file dev database)
- NextAuth v5 (Microsoft Entra ID + temporary dev credentials provider)
- Tailwind CSS v4, Neon Teal design system (see `src/app/globals.css`)

## Project structure

- `src/app/(app)/*` — authenticated app shell (dashboard, categories,
  resources, admin, submit, requests)
- `src/app/login`, `src/app/api/auth` — auth
- `src/lib/search.ts` — fuzzy/synonym search engine
- `src/lib/categories.ts` — default seed categories (admin-editable at
  runtime once category management UI is built)
- `prisma/schema.prisma` — full data model covering the spec (users,
  categories, resources, tags, attachments, submissions, versions,
  favourites, recently viewed, search logs, notifications, audit logs,
  information requests, quotes/fun facts, quick links, notices)

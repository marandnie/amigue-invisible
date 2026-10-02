> **Nota (oct 2026):** este documento sigue siendo la referencia de producto (modelo de datos, rutas, features), pero las secciones **"Recommended stack"** y **"Deployment (AWS)"** quedaron obsoletas. El stack vigente es Firebase (App Hosting + Firestore + Auth): ver [`.specify/memory/constitution.md`](.specify/memory/constitution.md) y [`specs/`](specs/). Las specs mandan sobre este documento.

# Amigo Invisible — Design Doc

A web app for running "amigo invisible" (secret santa) draws: a host creates a group, invites people (who sign in to accept), the app randomly assigns each person a giftee while respecting exclusions, and each participant gets a private page with their assignment, wishlists, and event details.

This doc borrows the *shape* of [spring-petclinic](https://github.com/spring-projects/spring-petclinic) (a classic server-rendered CRUD reference app) but replaces the Java/Spring stack with a lighter one more appropriate for a small site. The goal of the mapping is to reuse PetClinic's clear, small-app conventions — page-per-resource, list → detail → nested item, Bootstrap layout — without dragging along the JVM.

## What we're borrowing from PetClinic

PetClinic is built around four conventions that translate cleanly to this project:

1. **One resource per URL segment.** `/owners/{id}`, `/owners/{id}/pets/new`, `/vets.html`. Each page does one thing, no SPA complexity. We'll do the same: `/groups/{id}`, `/groups/{id}/participants/new`.
2. **Nested ownership.** A Pet belongs to an Owner; a Visit belongs to a Pet. For us: a Participant belongs to a Group; a Wishlist item belongs to a Participant.
3. **Server-rendered pages with a shared layout fragment.** PetClinic uses Thymeleaf + a `fragments/layout` partial + Bootstrap. We'll mirror this — one base layout, per-page templates, Bootstrap-style components.
4. **"Find" and "create-or-update" form patterns.** PetClinic's `findOwners` + `createOrUpdateOwnerForm` pattern is a good template for our "find my group" and "create/edit group" flows.

What we're **not** borrowing: the JVM, Maven/Gradle, JPA, H2, the Vet directory (no analog), the visits-as-appointments model (we'll repurpose the idea as wishlists).

## Recommended stack

**Next.js 15 (App Router) + Prisma + Postgres + Auth.js + Tailwind + shadcn/ui, deployed on AWS.**

Rationale, translated from PetClinic equivalents:

| PetClinic | Amigo Invisible | Why |
|---|---|---|
| Spring Boot controllers | Next.js route handlers + server actions | Server-rendered pages, minimal JS shipped |
| Thymeleaf templates | React server components | Same mental model: render on the server, hydrate only interactive bits |
| Spring Data JPA + H2 | Prisma + Postgres (local Docker in dev, RDS in prod) | Typed data layer, easy migrations; same dialect in dev and prod so nothing surprises you at deploy time |
| Spring Security | Auth.js (NextAuth) with Prisma adapter | Covers all three sign-in methods we chose: credentials (email + password), magic link, Google OAuth |
| Bootstrap + custom SCSS | Tailwind + shadcn/ui | Similar "utility + components" split, good defaults, smaller bundle |
| Maven/Gradle | npm/pnpm | One toolchain end-to-end |
| Deployed to a JVM server | AWS (see deployment section) | Managed build/deploy, managed Postgres, managed email |

**Alternative if you'd rather stay closer to PetClinic's server-rendered feel:** SvelteKit + Drizzle + Lucia (for auth) on the same AWS footprint. Same shape, slightly less boilerplate. Mentioned so you know it exists — I'd still default to Next.js for ecosystem fit, especially since Auth.js does a lot of work out of the box for the three sign-in methods we want.

## Data model

Six app entities plus the standard Auth.js tables.

App entities, roughly paralleling PetClinic's:

- **User** — a signed-in person. Fields: `id`, `email` (unique), `name`, `image` (from Google, optional), `passwordHash` (nullable — only set when they signed up via email+password), `emailVerified`, `createdAt`. Auth.js's Prisma adapter also creates `Account`, `Session`, and `VerificationToken` tables for OAuth tokens, active sessions, and magic-link codes respectively. We don't touch these directly.
- **Group** *(≈ PetClinic Owner)* — the draw itself. Fields: `id`, `name`, `hostUserId` (FK → User), `budget`, `currency`, `eventDate`, `eventLocation`, `notes`, `drawnAt` (nullable — null means the draw hasn't run yet). No more `inviteToken` on the group; invites are per-participant (see Invitation below).
- **Participant** *(≈ PetClinic Pet)* — a person in the group. Fields: `id`, `groupId`, `userId` (FK → User, nullable until they accept the invite), `invitedEmail`, `invitedName`, `joinedAt`. The host enters name+email when adding someone; the row stays "pending" until the invitee signs in (via any of the three methods) from the invitation link, at which point `userId` gets filled in.
- **Invitation** — a pending invite for a Participant row. Fields: `id`, `participantId`, `token` (random URL slug), `expiresAt`, `acceptedAt`. Separate from `Participant` so we can rotate/resend tokens without churning the participant record.
- **WishlistItem** *(≈ PetClinic Visit)* — one line on a participant's wishlist. Fields: `id`, `participantId`, `text`, `url` (optional link), `createdAt`.
- **Exclusion** — "A must not draw B". Fields: `id`, `groupId`, `fromParticipantId`, `toParticipantId`. Usually created in pairs (mutual exclusion) but stored as directed edges to keep the draw algorithm simple.
- **Assignment** — the result of the draw. Fields: `id`, `groupId`, `giverId`, `receiverId`. Created in a single transaction when the host runs the draw.

Notes: spouses-shouldn't-draw-each-other is the main use case for Exclusion — the UI adds both directions when the host checks a "mutual" box. The `Participant ↔ User` relationship is many-to-many across the system (one user can be in many groups) but one-to-one within a given group (enforced by a unique index on `(groupId, userId)`).

## Page / route structure

Modeled on PetClinic's routes; shortened to what we actually need. Every route except `/`, `/login`, `/signup`, and `/invitations/{token}` requires an authenticated session. Authorization is role-based per group: host can manage everything, participants can only view group info and their own private page.

**Public:**
- `/` — landing page. Explains what Amigo Invisible is; CTAs for "Create a group" (sends unauthenticated users to signup first) and "Log in".
- `/login` — sign-in page with three options: email + password, magic link, Google.
- `/signup` — sign-up page with the same three options. Email+password users get an email-verification link before they can create groups.
- `/invitations/{token}` — invitation landing. Shows group name, budget, event date. If the visitor is already logged in and their email matches, one-click "Accept." If not logged in, prompt to sign in / sign up, then redirect back here.

**Authenticated (shared):**
- `/dashboard` — the user's groups: groups they host, groups they're participating in, pending invitations. Equivalent to PetClinic's "Find Owners" page but scoped to the signed-in user.
- `/settings` — account settings: name, avatar, email, password (if set), linked Google account, delete account.

**Host-only (within a group they host):**
- `/groups/new` — create group form (name, budget, date, location). Host is set to the current user automatically.
- `/groups/{id}` — group detail (like PetClinic's owner detail). Shows participants list with pending/accepted status, budget, event info, exclusions summary, and a "Run draw" button once there are ≥3 accepted participants. After the draw is run, shows "Draw completed on X" and the host's own assignment.
- `/groups/{id}/edit` — edit group details.
- `/groups/{id}/participants/new` — invite a participant (name, email). Creates a Participant + Invitation row and sends the email.
- `/groups/{id}/participants/{pid}/edit` — edit, resend invite, or remove.
- `/groups/{id}/exclusions` — manage exclusions (checkbox matrix or pair selector).
- `/groups/{id}/draw` — POST endpoint to run the draw; redirects back to group detail.

**Participant-facing (within a group they've joined):**
- `/groups/{id}/me` — participant's private page for that group. Before the draw: edit your wishlist, see group info, see your exclusions. After the draw: your assigned giftee's name + their wishlist. Replaces the old token-URL `/me/{accessToken}`.

**Email touchpoints** (SES; stubbed to console in dev):
- On signup via email+password: email verification link.
- On magic-link login: one-time login link.
- On invite: the invitee gets a link to `/invitations/{token}`.
- On draw: every participant gets a "your assignment is ready" email linking to `/groups/{id}/me`.

## Feature breakdown

The four features you selected, translated into concrete scope:

**1. Create a group & invite people.** A signed-in user creates a group on `/groups/new` and lands on `/groups/{id}`. They add participants one at a time or paste a list of "Name, email" pairs for bulk add. Each invite creates a Participant + Invitation row and sends an email with a link to `/invitations/{token}`. If the invitee already has an account, one click accepts; otherwise they're routed through signup (email+password, magic link, or Google) and bounced back to accept. The Participant row's `userId` is filled in on acceptance, which is what unlocks their access to the group.

**2. Random secret assignment.** When the host clicks "Run draw," the server runs the assignment algorithm in a transaction:
- Build a directed graph of allowed pairings (everyone → everyone except self and exclusions).
- Find a Hamiltonian cycle through it (or a derangement that satisfies constraints). For small groups (<50 people), a randomized retry loop is fine: shuffle, check validity, retry up to N times; if it keeps failing, report "exclusions are too restrictive."
- Persist the resulting `Assignment` rows, set `Group.drawnAt`, send emails.
- Once `drawnAt` is set, the group becomes read-only for participants and the assignment shows on each `/me/{accessToken}`.

**3. Exclusions & wishlists.** Exclusions managed from `/groups/{id}/exclusions` as a checkbox matrix — each checked cell creates an `Exclusion` row (and its inverse if "mutual" is on). Wishlists live on `/groups/{id}/me`: free-form list of items, optional URLs. Wishlists stay editable after the draw so people can refine before the event. The giver sees their receiver's wishlist on their own `/groups/{id}/me` page.

**4. Budget & event details.** Stored on `Group` (budget, currency, event date, location, notes). Displayed prominently on the group page, on the invitation landing, and on each participant's private page. No calculations — this is just informational.

## What's out of scope (explicitly)

To keep the first version tight:

- No social-login providers beyond Google (no Apple, GitHub, Facebook). Can be added later by registering more Auth.js providers.
- No two-factor authentication. Reasonable to add later; Auth.js supports it via plugins.
- No multi-language yet. Spanish copy for the UI can be added once the English/structure is stable.
- No gift-received confirmation, no chat, no anonymous Q&A between giver and receiver (common in some secret santa apps — can come later).
- No payment / pooled budget handling.

## Suggested build order

If you want a roadmap, this order keeps each step demo-able:

1. Scaffold Next.js + Prisma + Postgres (Docker Compose locally) + Tailwind + shadcn/ui. Set up the layout shell (navbar with login state + footer) mirroring PetClinic's layout fragment.
2. Auth.js with all three providers (credentials, email magic link, Google) + Prisma adapter. Signup, login, logout, session middleware, `/dashboard` stub, `/settings`. This goes early because every subsequent route depends on auth.
3. Data model + migrations for the six app entities.
4. Group CRUD + list/detail pages, scoped to the signed-in host — you can now create and view groups end-to-end.
5. Participant invite flow: add participant → send email → `/invitations/{token}` → accept → Participant linked to User. PetClinic's Pet flow adapted to an email-mediated handshake.
6. Wishlist CRUD on `/groups/{id}/me`.
7. Exclusions UI.
8. Draw algorithm + assignment persistence + `/groups/{id}/me` post-draw view.
9. Email sending wired to SES (stub in dev).
10. Deploy to AWS (Amplify + RDS + SES); set up Google OAuth redirect URIs for each environment.
11. Polish: landing page copy, Spanish translation, empty states, error pages.

## Deployment (AWS)

**AWS Amplify Hosting** for the Next.js app. Connects to your Git repo, handles builds, preview deploys per branch, SSL, and env vars. Native support for Next.js SSR and server actions, so Auth.js and route handlers work without extra config.

**Amazon RDS for PostgreSQL** (or **Aurora Serverless v2** if you want it to scale to near-zero when idle) for the database. Connection string goes into Amplify env vars; Prisma points at it. Use AWS Secrets Manager for the password. Create a separate DB for dev/staging/prod.

**Amazon SES** for all outgoing email: verification, magic links, invitations, draw notifications. Start in the sandbox (sends only to verified addresses) while developing; request production access before launch. Auth.js's email provider has a standard Nodemailer transport, which points cleanly at SES SMTP.

**Google OAuth:** register redirect URIs for each environment (`https://<branch>.<amplify-domain>/api/auth/callback/google` and your production domain) in Google Cloud Console. Store client ID/secret as Amplify env vars.

Nice-to-haves once it's running: CloudFront in front of Amplify for caching static assets, CloudWatch for logs and error alerts, and a Route 53 custom domain.

## Open questions for you

A few things I'd still want to nail down before writing code:

- **Multi-language:** English first and translate later, or build bilingual (es/en) from day one? Your project description is in Spanish, so probably worth knowing up front.
- **Domain / app name:** "Amigo Invisible" is the project codename — is that also the public brand? Affects the logo/landing page.
- **Session length:** how long should a user stay logged in? Auth.js defaults to 30 days; happy to tune.
- **Password rules:** minimum length, special chars, etc. Mostly a defaults question — suggest 10 chars, no forced complexity, block the top 10k breached passwords via zxcvbn.

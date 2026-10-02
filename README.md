# Amigo Invisible

A secret-santa draw app. See [DESIGN.md](./DESIGN.md) for the full design rationale — this README is just about running and deploying the code.

Inspired by the structure of [spring-petclinic](https://github.com/spring-projects/spring-petclinic), rebuilt on a lighter stack:

- **Next.js 15** (App Router, server components, server actions)
- **Prisma + PostgreSQL**
- **Auth.js v5** (email + password, magic link, Google)
- **Tailwind + shadcn-style components**
- **Deploys to AWS** (Amplify Hosting + RDS + SES)

## What's in this scaffold

Ship-ready infrastructure: Auth.js with all three sign-in methods, the full Prisma schema, and a working end-to-end flow from signup through creating a group, inviting participants, and accepting invitations. The draw algorithm, wishlist editing UI, and exclusions matrix are stubbed with TODOs — see [DESIGN.md](./DESIGN.md) "Suggested build order" for what to build next.

## Local development

You'll need Node 20+ and a running Postgres. The fastest path is Docker:

```bash
docker run --name amigo-postgres \
  -e POSTGRES_USER=amigo \
  -e POSTGRES_PASSWORD=amigo \
  -e POSTGRES_DB=amigo_invisible \
  -p 5432:5432 \
  -d postgres:16
```

Then:

```bash
cp .env.example .env
# Edit .env — at minimum set AUTH_SECRET (run: openssl rand -base64 32)

npm install
npx prisma migrate dev --name init
npm run dev
```

The app runs at http://localhost:3000.

For the Google OAuth button to work locally, create credentials at the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with redirect URI `http://localhost:3000/api/auth/callback/google` and paste the client ID/secret into `.env`.

For magic-link email to work locally, point `EMAIL_SERVER_*` at any SMTP server. [Mailpit](https://github.com/axllent/mailpit) is a good zero-config option.

## Deploying to AWS

1. **Push this repo to Git** (GitHub or CodeCommit).
2. **Create an RDS Postgres instance** (db.t4g.micro is plenty for getting started). Record the connection string.
3. **Connect to Amplify Hosting:** AWS Console → Amplify → "Host a web app" → pick your Git provider and branch. Amplify will detect `amplify.yml` automatically.
4. **Set environment variables in the Amplify console** (all the ones from `.env.example`). Critical ones:
   - `DATABASE_URL` — your RDS connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — your production URL (e.g. `https://amigoinvisible.com`)
   - `AUTH_TRUST_HOST=true`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — add your production URL to the Google OAuth redirect list too
   - `EMAIL_SERVER_*` and `EMAIL_FROM` — pointed at SES SMTP (verify the from-address first)
5. **First-time DB setup:** the `amplify.yml` build runs `prisma migrate deploy` automatically, so migrations apply on every deploy. You'll need to create at least one migration locally with `npx prisma migrate dev --name init` and commit it before the first Amplify deploy.
6. **Request SES production access** when you're ready to send email to addresses you haven't verified.

## Project layout

```
app/
  api/auth/[...nextauth]/    NextAuth handlers
  login/                     Sign-in page (password + magic link + Google)
  signup/                    Sign-up page
  dashboard/                 User's groups (hosted + joined)
  groups/new/                Create-group form
  groups/[id]/               Group detail (host and participant views)
  groups/[id]/me/            Participant's private page
  invitations/[token]/       Invite landing + accept flow
  layout.tsx                 Root layout + navbar
  page.tsx                   Landing page
components/
  ui/                        Button, Input, Card (shadcn-style)
  navbar.tsx
lib/
  auth.ts                    Auth.js config (3 providers)
  prisma.ts                  Prisma client singleton
  utils.ts                   cn() helper
prisma/
  schema.prisma              All entities + Auth.js tables
middleware.ts                Route protection
amplify.yml                  AWS Amplify build spec
```

## TODOs (see DESIGN.md for rationale)

- Draw algorithm + `/groups/{id}/draw` POST handler (build order step 8).
- Wishlist create/edit/delete server actions on `/groups/{id}/me` (step 6).
- Exclusions matrix UI on `/groups/{id}/exclusions` (step 7).
- Invitation email sending via Nodemailer/SES when a participant is added (step 5).
- Spanish translation (step 11).
- `/groups/{id}/participants/new` form wiring.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Multi-Tenant Foundation (Supabase)

Neue Dateien:

- `supabase/migrations/20260216120000_multi_tenant_foundation.sql`
  - Tabellen `orgs` und `org_members`
  - RLS + Policies: User sieht nur Orgs, in denen er Mitglied ist
- `lib/org/server.ts`
  - `getActiveOrgId()` (server helper)
  - `ensureUserHasOrgMembership()` (serverseitiger Bootstrap)
- `app/app/layout.tsx`
  - ruft Bootstrap beim Laden des geschützten App-Bereichs auf

### Umgebungsvariablen

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Schnelltest

1. Migrationen in Supabase ausführen (SQL Editor oder `supabase db push`).
2. App starten und neuen User registrieren.
3. Nach Login `/app` öffnen.
4. Erwartung (Bootstrap funktioniert weiterhin):
   - In `org_members` existiert ein Datensatz mit `role = 'owner'` für den User.
   - In `orgs` wurde eine Org erzeugt und `created_by` ist der eingeloggte User.
   - Zugriff auf `orgs` über den User-Token liefert nur eigene Mitglieds-Orgs.

### RLS-Sicherheitsfix testen (Membership Injection)

1. Erzeuge zwei Benutzer (A und B), jeweils mit eigener Org durch Login/Bootstrap.
2. Nimm die `org_id` von Benutzer A.
3. Versuche als Benutzer B via REST/API einen Insert in `org_members` mit dieser fremden `org_id` und `user_id = B`.
4. Erwartung:
   - Insert wird durch RLS geblockt (`new row violates row-level security policy` bzw. 401/403 im Client).
   - Benutzer B kann sich nicht in eine fremde Org “reinjoinen”.
5. Positivfall:
   - Für die eigene Org des Benutzers B ist der Bootstrap-Insert (owner membership) weiterhin erlaubt.

### Bootstrap-Bugfix testen

1. Mit einem neuen User einloggen und `/app` neu laden.
2. In Supabase prüfen:
   - `orgs` enthält genau 1 neue Row für den User.
   - `org_members` enthält die passende `owner`-Membership.
3. Falls das Erzeugen fehlschlägt, prüfe Server-Logs auf:
   - `[ensureUserHasOrgMembership] create org failed`
   - `[ensureUserHasOrgMembership] create membership failed`

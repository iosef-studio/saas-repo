# PROJECT_STATUS.md

**Projekt:** Project Godspeed
**Stand:** 2026-03-04
**Phase:** Foundation (v0.1)

---

## Was ist der aktuelle Stand?

Das Fundament steht. Authentifizierung (Login/Registrierung), Multi-Tenancy (mehrere Firmen in einer App) und die grundlegende App-Struktur sind implementiert. Es gibt noch keine Business-Features (Kunden, Verträge, Automationen) – nur das technische Gerüst.

---

## Aktuelle Architektur

### Überblick

```
Browser (Nutzer)
    ↓
Next.js App Router (Frontend + API-Routes)
    ↓
Supabase (Datenbank + Auth-Service)
```

**Was bedeutet das?**

- **Next.js App Router** ist das Framework, das die Website ausliefert. Es kann sowohl Seiten rendern (Frontend) als auch API-Endpunkte bereitstellen (Backend). Die App nutzt den „App Router" – das ist die moderne Routing-Variante von Next.js, bei der jede Datei in `/app` automatisch eine Route wird.

- **Supabase** ist ein Backend-as-a-Service. Es stellt eine PostgreSQL-Datenbank bereit und übernimmt die Nutzer-Authentifizierung. Wir nutzen Supabase nicht über deren JavaScript-SDK, sondern sprechen die REST-API direkt an (per `fetch`). Das gibt uns mehr Kontrolle.

### Ordnerstruktur

```
/app                          ← Alle Seiten und API-Routen
  /api/login/route.ts         ← Login-Endpunkt (POST)
  /api/register/route.ts      ← Registrierungs-Endpunkt (POST)
  /login/page.tsx              ← Login-Seite (UI)
  /app/layout.tsx              ← Geschützter Bereich (Auth-Check + Sidebar)
  /app/page.tsx                ← Dashboard (Startseite nach Login)
  /app/logout/route.ts         ← Logout-Endpunkt
  /page.tsx                    ← Öffentliche Startseite
  /layout.tsx                  ← Root-Layout (Schriften, Meta)
  /globals.css                 ← Tailwind CSS + Theme-Variablen

/lib                           ← Hilfsfunktionen
  /supabase/auth.ts            ← Supabase-URL, API-Key, Header-Helfer
  /org/server.ts               ← Multi-Tenant-Logik (nur serverseitig)

/supabase/migrations           ← Datenbank-Migrationen (SQL-Dateien)
  20260216120000_multi_tenant_foundation.sql
  20260216133000_fix_rls_membership_injection.sql
```

### Server-First-Prinzip

Die App folgt einem „Server-First"-Ansatz. Das bedeutet:

- Sensible Logik (Auth-Checks, Datenbank-Abfragen, Org-Zuordnung) läuft **nur auf dem Server**
- Auth-Tokens werden als **HTTP-only Cookies** gespeichert – JavaScript im Browser kann sie nicht lesen (Schutz vor XSS-Angriffen)
- Die Datei `lib/org/server.ts` ist mit `"use server"` und `"server-only"` markiert – sie kann physisch nicht im Browser ausgeführt werden

---

## Implementierte Features

### 1. Authentifizierung (Login & Registrierung)

**Was funktioniert:**

- Login-Seite mit E-Mail + Passwort (`/login`)
- Umschalten zwischen Login und Registrierung auf derselben Seite
- Login: POST an `/api/login` → Supabase prüft Zugangsdaten → setzt Cookies
- Registrierung: POST an `/api/register` → Supabase legt Nutzer an
- E-Mail-Bestätigung wird erkannt (falls in Supabase aktiviert)
- Logout: POST an `/app/logout` → löscht Cookies → Weiterleitung zu `/login`
- UI ist auf Deutsch

**Wie der Login-Flow funktioniert:**

```
1. Nutzer gibt E-Mail + Passwort ein
2. Browser sendet POST an /api/login
3. Server leitet Anfrage an Supabase weiter
4. Supabase prüft Zugangsdaten
5. Bei Erfolg: Supabase gibt Access-Token + Refresh-Token zurück
6. Server speichert beide als HTTP-only Cookies
7. Browser wird zu /app weitergeleitet
```

### 2. Multi-Tenancy (Mandantentrennung)

**Was bedeutet Multi-Tenancy?**

Mehrere Firmen nutzen dieselbe App, sehen aber nur ihre eigenen Daten. Firma A kann die Kunden von Firma B nicht sehen. Das ist ein Kernkonzept des gesamten Produkts.

**Was funktioniert:**

- Automatische Org-Erstellung beim ersten Login (Bootstrap)
- Jeder Nutzer wird seiner Organisation zugeordnet
- Die Org-ID wird im geschützten Bereich angezeigt (erste 8 Zeichen)
- Datenisolation auf Datenbankebene durch RLS (Row Level Security)

**Wie der Bootstrap-Flow funktioniert:**

```
1. Nutzer öffnet /app (geschützter Bereich)
2. Server prüft: Hat der Nutzer ein Auth-Cookie?
   → Nein: Weiterleitung zu /login
   → Ja: Weiter
3. Server ruft ensureUserHasOrgMembership() auf
4. Prüft: Hat der Nutzer bereits eine Organisation?
   → Ja: Nutze die bestehende Org-ID
   → Nein: Erstelle neue Org ("Meine Organisation") + Mitgliedschaft als Owner
5. Seite wird gerendert
```

### 3. App-Shell (Layout)

**Was funktioniert:**

- Sidebar-Navigation (Desktop) mit: Dashboard, Kunden, Verträge, Einstellungen
- Header mit Org-ID und Logout-Button
- Responsives Layout (Sidebar versteckt auf Mobilgeräten)
- Dashboard-Startseite mit 4 Feature-Karten (Platzhalter)
- Dark Mode wird grundsätzlich unterstützt (via CSS-Variablen)

---

## Datenbankstruktur

### Tabelle: `orgs`

Speichert die Organisationen (Firmen).

| Spalte       | Typ           | Beschreibung                                    |
|-------------|---------------|------------------------------------------------|
| `id`        | UUID          | Eindeutige ID (automatisch generiert)          |
| `name`      | Text          | Firmenname (Standard: "Meine Organisation")     |
| `created_by`| UUID          | Nutzer-ID des Erstellers                        |
| `created_at`| Zeitstempel   | Erstellungsdatum                                |

### Tabelle: `org_members`

Verknüpft Nutzer mit Organisationen.

| Spalte       | Typ           | Beschreibung                                    |
|-------------|---------------|------------------------------------------------|
| `id`        | UUID          | Eindeutige ID                                   |
| `org_id`    | UUID          | Verweis auf `orgs.id`                           |
| `user_id`   | UUID          | Verweis auf den Supabase-Auth-Nutzer            |
| `role`      | Text          | Rolle: `owner`, `admin` oder `member`           |
| `created_at`| Zeitstempel   | Erstellungsdatum                                |

**Einschränkung:** Ein Nutzer kann pro Organisation nur einmal vorkommen (UNIQUE auf `org_id` + `user_id`).

### Tabelle: `auth.users` (von Supabase verwaltet)

Diese Tabelle gehört zu Supabase und speichert E-Mail, Passwort-Hash, etc. Wir verwalten sie nicht direkt – Supabase kümmert sich darum.

### Row Level Security (RLS)

**Was ist RLS?**

Row Level Security ist ein PostgreSQL-Feature. Es sorgt dafür, dass Datenbankabfragen automatisch gefiltert werden – ein Nutzer sieht nur die Zeilen, die ihm „gehören". Das passiert auf Datenbankebene, nicht im App-Code. Selbst wenn der App-Code einen Bug hätte, könnte ein Nutzer keine fremden Daten sehen.

**Aktive Policies:**

| Tabelle       | Aktion  | Regel                                                              |
|--------------|---------|--------------------------------------------------------------------|
| `orgs`       | SELECT  | Nur sichtbar, wenn Nutzer Mitglied der Org ist                     |
| `orgs`       | INSERT  | Nur möglich, wenn `created_by` = eigene Nutzer-ID                  |
| `org_members`| SELECT  | Nur eigene Mitgliedschaften sichtbar                               |
| `org_members`| INSERT  | Nur für eigene Nutzer-ID + nur wenn Org-Ersteller oder Admin/Owner |

**Sicherheitsfix:** Die zweite Migration (`fix_rls_membership_injection.sql`) schließt eine Lücke, bei der ein Nutzer sich selbst in fremde Organisationen eintragen konnte. Jetzt ist das nur noch möglich, wenn man die Org erstellt hat oder bereits Owner/Admin darin ist.

---

## Authentifizierungs-Flow (Zusammenfassung)

```
┌─────────────┐     POST /api/login      ┌──────────────┐
│  Login-Seite │ ──────────────────────►  │  API-Route   │
│  (Browser)   │                          │  (Server)    │
└─────────────┘                          └──────┬───────┘
                                                │
                                    fetch() an Supabase
                                    /auth/v1/token
                                                │
                                         ┌──────▼───────┐
                                         │   Supabase   │
                                         │   Auth       │
                                         └──────┬───────┘
                                                │
                                    Tokens zurück an Server
                                                │
                                         ┌──────▼───────┐
                                         │  Server setzt │
                                         │  HTTP-only    │
                                         │  Cookies      │
                                         └──────┬───────┘
                                                │
                                    Redirect zu /app
                                                │
                                         ┌──────▼───────┐
                                         │  /app/layout  │
                                         │  prüft Cookie │
                                         │  + Bootstrap  │
                                         └──────────────┘
```

**Wichtige Sicherheitsmerkmale:**

- Tokens werden **nie** an den Browser-JavaScript-Code weitergegeben
- Cookies sind `httpOnly` (nicht per JS lesbar) und `secure` (nur über HTTPS)
- Supabase-Anfragen werden immer vom Server gestellt, nie vom Browser direkt

---

## Aktueller Multi-Tenant-Ansatz

### Wie funktioniert die Datentrennung?

1. **Datenbankebene (RLS):** PostgreSQL filtert Zeilen automatisch nach Nutzer-ID
2. **App-Ebene:** `getActiveOrgId()` liefert die aktive Org-ID des Nutzers
3. **Bootstrap:** Beim ersten Login wird automatisch eine Org + Mitgliedschaft erstellt

### Was noch fehlt bei Multi-Tenancy:

- **Org-Switching:** Nutzer können aktuell nicht zwischen mehreren Orgs wechseln (es wird immer die erste genommen)
- **Einladungen:** Es gibt keinen Weg, weitere Nutzer in eine Org einzuladen
- **Org-Einstellungen:** Kein UI zum Bearbeiten von Org-Name oder Einstellungen
- **Rollen-Logik im UI:** Die Rollen `owner`, `admin`, `member` existieren in der DB, werden aber im UI nicht unterschieden

---

## Fehlende Teile für Version 1.0

Die CLAUDE.md definiert V1.0 als „Automatisiertes Vertragssystem + Mini-CRM". Hier ist, was fehlt:

### CRM-Light (Kundenverwaltung)

| Feature               | Status         |
|-----------------------|---------------|
| Kundenliste           | Nicht begonnen |
| Kunden-Detailseite    | Nicht begonnen |
| Status pro Kunde      | Nicht begonnen |
| Interne Notizen       | Nicht begonnen |
| DB-Tabelle `clients`  | Nicht begonnen |

### Vertragsmanagement

| Feature                          | Status         |
|----------------------------------|---------------|
| Vertrag als Datensatz            | Nicht begonnen |
| Status (Entwurf/gesendet/…)     | Nicht begonnen |
| Statuswechsel-UI                 | Nicht begonnen |
| DB-Tabelle `contracts`           | Nicht begonnen |

### Automationen

| Feature                          | Status         |
|----------------------------------|---------------|
| E-Mail-Trigger je Status         | Nicht begonnen |
| Erinnerungen                     | Nicht begonnen |
| E-Mail-Log                       | Nicht begonnen |
| Resend-Integration               | Nicht begonnen |

### UI / App Shell

| Feature                          | Status         |
|----------------------------------|---------------|
| Sidebar-Navigation               | Vorhanden (Grundstruktur) |
| Dashboard                        | Vorhanden (Platzhalter)   |
| Notion/Linear-Style Design       | Ansätze vorhanden         |
| Mobile-Responsive                | Teilweise                 |

### Infrastruktur

| Feature                          | Status         |
|----------------------------------|---------------|
| Stripe-Integration (Bezahlung)   | Nicht begonnen |
| Vercel-Deployment                | Nicht konfiguriert |
| E-Mail-Versand (Resend)          | Nicht begonnen |
| Error Handling / Monitoring      | Nicht begonnen |

---

## Größte technische Risiken

### 1. Kein Supabase-SDK – Direkte REST-API-Aufrufe

**Risiko:** Die App nutzt `fetch()` direkt gegen die Supabase-REST-API, statt das offizielle Supabase-JS-SDK zu verwenden.

**Was das bedeutet:** Funktionen wie automatisches Token-Refresh, Realtime-Subscriptions und typsichere Abfragen müssen manuell implementiert werden. Das ist mehr Arbeit und fehleranfälliger.

**Empfehlung:** Auf `@supabase/supabase-js` mit dem Server-Side-Paket `@supabase/ssr` umsteigen. Das SDK übernimmt Cookie-Handling, Token-Refresh und bietet typsichere Abfragen.

### 2. Kein Token-Refresh

**Risiko:** Access-Tokens laufen nach einer bestimmten Zeit ab (typisch: 1 Stunde). Aktuell gibt es keinen Mechanismus, der das Token automatisch erneuert.

**Was das bedeutet:** Nutzer werden nach Ablauf des Tokens ausgeloggt und müssen sich neu einloggen, auch wenn sie die App aktiv nutzen.

**Empfehlung:** Token-Refresh-Logik implementieren (am besten via Supabase-SDK, das das automatisch macht).

### 3. Kein Middleware-basierter Auth-Check

**Risiko:** Der Auth-Check passiert aktuell im `layout.tsx` des geschützten Bereichs. Next.js hat dafür eine Middleware (`middleware.ts`), die vor dem Rendern einer Seite greift.

**Was das bedeutet:** Bei einem Fehler im Layout könnte theoretisch ein unauthentifizierter Nutzer kurz Zugriff auf geschützte Inhalte bekommen. Middleware würde das auf Routing-Ebene verhindern.

**Empfehlung:** Zusätzlich eine `middleware.ts` einführen, die `/app/*`-Routen schützt.

### 4. Fehlende Eingabevalidierung

**Risiko:** Die API-Routen für Login und Registrierung prüfen nur, ob E-Mail und Passwort vorhanden sind – nicht deren Format oder Stärke.

**Was das bedeutet:** Schwache Passwörter werden akzeptiert. Ungültige E-Mail-Formate werden erst von Supabase abgelehnt, nicht von unserer App.

**Empfehlung:** Validierung mit einer Library wie `zod` einführen (E-Mail-Format, Passwort-Mindestanforderungen).

### 5. Keine Fehlerbehandlung bei Supabase-Ausfällen

**Risiko:** Wenn Supabase nicht erreichbar ist, gibt die App kryptische Fehlermeldungen oder bricht ab.

**Was das bedeutet:** Nutzer sehen im Fehlerfall keine hilfreiche Nachricht. Es gibt kein Logging oder Monitoring.

**Empfehlung:** Globale Error-Boundary für React, strukturierte Fehlermeldungen, und perspektivisch ein Monitoring-Tool (z.B. Sentry).

### 6. Session-Verwaltung bei Multi-Org

**Risiko:** `getActiveOrgId()` gibt immer die erste Organisation zurück. Es gibt kein Konzept einer „aktiven Session" mit gewählter Org.

**Was das bedeutet:** Sobald ein Nutzer in mehreren Orgs Mitglied ist, kann er nicht wechseln. Das ist für V1.0 vielleicht akzeptabel (ein Nutzer = eine Org), wird aber bei wachsender Nutzerbasis zum Problem.

**Empfehlung:** Für V1.0 akzeptabel. Für V1.5 eine Session-basierte Org-Auswahl einbauen.

---

## Empfohlener nächster Entwicklungsschritt

### Schritt 1: Supabase-SDK einführen

**Warum zuerst?** Jedes zukünftige Feature (CRM, Verträge, Automationen) braucht Datenbank-Abfragen. Das aktuelle manuelle `fetch()`-Pattern ist fehleranfällig und umständlich. Das SDK einzuführen, bevor mehr Code darauf aufbaut, spart langfristig massiv Aufwand.

**Was dafür nötig ist:**

1. `@supabase/supabase-js` und `@supabase/ssr` installieren
2. Server-Client-Helper erstellen (Cookie-basiert)
3. Bestehende `fetch()`-Aufrufe in `lib/org/server.ts` und den API-Routes migrieren
4. Token-Refresh wird damit automatisch gelöst
5. Optional: Typen aus der Datenbank generieren (`supabase gen types`)

### Schritt 2: Middleware für Auth-Schutz

Nach dem SDK-Umbau eine `middleware.ts` einführen, die alle `/app/*`-Routen serverseitig absichert und Token-Refresh übernimmt.

### Schritt 3: CRM-Grundlage (Kunden-Tabelle + Liste)

Erst dann das erste echte Business-Feature: eine `clients`-Tabelle mit RLS und eine einfache Kundenliste im Dashboard. Das ist der kleinste sichtbare Fortschritt in Richtung V1.0.

---

## Abgeschlossene Meilensteine

- [x] Next.js-Projekt aufgesetzt (App Router, TypeScript, Tailwind)
- [x] Supabase-Authentifizierung (Login + Registrierung)
- [x] HTTP-only Cookie-basierte Session
- [x] Multi-Tenant-Datenbankstruktur (`orgs` + `org_members`)
- [x] Row Level Security (RLS) Policies
- [x] Sicherheitsfix: Membership-Injection verhindert
- [x] App-Shell mit Sidebar und geschütztem Bereich
- [x] Auto-Bootstrap: Org-Erstellung beim ersten Login
- [x] Deutsche UI-Texte

---

## Nächstes Ziel

**Supabase-SDK-Migration + Middleware-Auth + erste CRM-Tabelle**

Danach ist die technische Basis solide genug, um die V1.0-Features (Kunden, Verträge, Automationen) zügig aufzubauen.

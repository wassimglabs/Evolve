# EVOLVE (foundation only)

Schedule-first personal habit system, local-first, single user. This repo contains the app foundation, a developer data sanity check, and local Google account linking. There is no Evolve user identity or backend.

## Run

Requires Node 22+. Google OAuth requires a custom app redirect scheme, so use a development build; it cannot be tested in Expo Go.

```bash
npx expo install   # only needed after pulling with a fresh node_modules
npx expo run:ios   # or: npx expo run:android
npx expo start --dev-client
```

- Or create a development build with `npx eas-cli@latest build --profile development`.
- Type check: `npx tsc --noEmit` · Lint: `npx expo lint` · Diagnostics: `npx expo-doctor`

## Folder structure

```
app/                      # Expo Router routes (file-based routing)
  _layout.tsx             # Root stack: loads fonts, opens the DB, checkin modal
  checkin.tsx             # Evening check-in (full-screen modal, no tab bar)
  (tabs)/
    _layout.tsx           # 5 tabs with a custom tab bar (Today/Plan/Lanes/Coach/Me)
    index.tsx             # Today
    plan.tsx              # Plan
    coach.tsx             # Coach
    lanes/
      index.tsx           # Lanes
      habits.tsx          # Habits sub-screen (Lanes tab highlighted)
    me/
      index.tsx           # Me
      insights.tsx        # Insights sub-screen (Me tab highlighted)
      settings.tsx        # Settings sub-screen (Me tab highlighted)
src/
  components/             # Icon, Screen, LargeHeader, Card, NavRow, Button, Switch,
                          # Segmented, Tag, SampleChip, SectionLabel, ProgressRing/Bar,
                          # Dot, StatusPill, EmptyState, TabBar
  hooks/                  # useTodayModel/usePlanModel/... + useSetting (settings-backed controls)
  theme/                  # tokens.ts (spec tokens) + fonts.ts + type.ts (type scale)
  lib/                    # haptics.ts, date.ts
  db/                     # client.ts (open + wipe + counts), migrations.ts, types.ts
  repositories/           # one typed file per table, plain functions, no ORM
  integrations/google/    # Google OAuth and local credential lifecycle
scripts/                  # reset-project.js (template tool, optional)
```

Notes on structure choices (simplest-option decisions):

- Routes live in the **root `app/`** directory as specified; when this project was scaffolded, `npx create-expo-app@latest` defaulted to `src/app/` and was moved.
- TypeScript `strict` is on (the template's `tsconfig.json`); imports use the `@/*` → `./src/*` alias.
- `npx expo lint` auto-added ESLint (eslint-config-expo) as devDependencies on first run.
- The SDK 58 template's demo components and packages were removed; what ships now above is the whole dependency surface.

## Database

Local SQLite via `expo-sqlite` (`evolve.db`, WAL mode). Screens use records saved on this device and show empty states when you have not entered data. There are no built-in demo records. Google connection metadata is stored locally in SQLite; OAuth tokens are stored in Expo SecureStore. Google linking is device-local and does not sign a user into an Evolve account or sync data to a backend.

Use **Me → Manage all records** to create, edit, and delete tasks, habits, timetable entries, jobs, content ideas, check-ins, and lane goals. Mark tasks complete and log a habit as minimum or full for today. Deleting a habit also removes its associated habit logs. This app is local-only; records do not sync between devices.

Migrations live in `src/db/migrations.ts` as an **ordered array of SQL strings** tracked in a `schema_version` table. Each entry runs exactly once, in a transaction, on app start; re-running is a no-op. To change the schema, append a new migration — never edit old ones.

### Conventions

- **Dates** are local `'YYYY-MM-DD'` strings (`src/lib/date.ts`).
- **Times of day** are **minutes from midnight** (integers). `(9*60, 10*60)` = 09:00–10:00; `src/lib/date.ts` converts both ways.
- **IDs** are UUID v4 from `expo-crypto` (`randomUUID`).
- **Timestamps** (`created_at`) are ISO 8601 UTC strings.
- **Booleans** are SQLite integers `0 | 1` (e.g. `habits.archived`).
- **day_of_week** is ISO: `1 = Monday … 7 = Sunday`.
- Free-form string enums (`kind`, `type`, `level`, `min_target`, `full_target`, `category`) are plain `TEXT` for now — values like `class/work`, `skipped/min/full` are conventions, sloppily not enforced by the DB yet.
- **`habit_logs` is insert-only by construction of the product** — history is never rewritten from the UI; the log repository's `update`/`delete` exist for tooling parity and are intentionally unused.
- The `settings` table is a key/value store; repository "get by id" is get by key, "create" is a plain insert (no upsert).
- Wiping (`wipeAllData` in `src/db/client.ts`) deletes **data rows only** — the schema, migration history and the `settings` table stay intact.

## UI decisions

Choices made while implementing the UI spec (section 5 of the design doc, "pick the simplest option that keeps the look identical"):

- **`src/theme/tokens.ts` is byte-exact from the spec.** Font family names live in `src/theme/fonts.ts` and the 32pt title style in `src/theme/type.ts`, so tokens.ts did not need extra exports. Font weight is carried by the family (e.g. `Inter_500Medium`), so `fontWeight` is not set alongside `fontFamily`.
- **Tab-bar highlighting for sub-screens** is structural: Habits lives inside the Lanes tab stack (`app/(tabs)/lanes/habits.tsx`) and Insights/Settings inside the Me tab stack, so the tab bar stays visible and the parent tab is highlighted natively. The previous tabs (`schedule`, root-level `habits`/`insights`/`settings`) were replaced by the spec's structure.
- **Life lane week value** (`Life · this week` → "2 h of 2 h", ratio 1.0) was not specified; picked a plausible filled value. All other lane numbers come from the spec.
- **Deadline rows** all have their 1pt top divider (including the first) — literal reading of "each: … top border".
- **Coach context chips** are small pills (~26pt) as drawn in the spec; the 44pt minimum applies to the quick-action chips and input.
- **Stepper gap** is 6pt (unspecified in the spec); glyph buttons clamp at 0–10 and dim at the bounds.
- **Check-in save** writes through `createDailyCheckin` / `updateDailyCheckin` (existing row found by today's local date), fires the success haptic, then dismisses. The subtitle is calculated from today's scheduled habits and logs.
- **`wipeAllData` no longer clears the `settings` table** (spec section 11: wipe must not delete settings). Signature unchanged.
- The old `useTheme`/light-mode plumbing (`use-theme.ts`, `use-color-scheme*.ts`) and unused primitives (`text`, `list-row`, `timeline-row`, `skeleton`, `segmented-control`, `connected-account-card`) were removed; the Google integration modules stay untouched (unused by UI for now).

## Google account linking setup

The OAuth code is implemented, but it is **not end-to-end verified until you configure Google Cloud credentials and test a development build**. No Google credentials or client secrets are included in this repository.

1. In Google Cloud Console, select/create a project and configure the OAuth consent screen. Set the app name and support email, choose the appropriate audience, and add your Google account under **Test users** while the app is in testing.
2. Set stable, unique `ios.bundleIdentifier` and `android.package` values in `app.json` before creating clients. Create an **iOS OAuth client** for that bundle ID and an **Android OAuth client** for that package name and the SHA-1 certificate fingerprint(s) used by your local/EAS development builds. Add production signing fingerprints before release.
3. Configure the Android callback as a verified HTTPS App Link on a domain you control. Set `EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI` to the exact HTTPS URL (for example, `https://your-domain.example/google/oauth2redirect`), authorize that exact redirect with the Google OAuth client as required by its configuration, then host `/.well-known/assetlinks.json` for the Android package and its SHA-256 signing-certificate fingerprint. The app config adds the matching Android intent filter. Android custom URI schemes are not used.
4. Copy `.env.example` to `.env` and set:
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — the iOS OAuth client ID. Its reversed Google scheme is added to the app config automatically; the callback is `com.googleusercontent.apps.<client-id-prefix>:/oauth2redirect`.
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` — the Android OAuth client ID.
   - `EXPO_PUBLIC_GOOGLE_ANDROID_REDIRECT_URI` — the exact verified HTTPS App Link callback URL.
5. In the consent screen, keep only the identity scopes requested by this milestone: `openid`, `email`, and `profile`. Do not create or add a client secret to the app. These client IDs are public identifiers, not secrets.
6. Rebuild the development app after changing client IDs, redirect configuration, package name, or bundle ID. Install it on a device/emulator, start Metro with `npx expo start --dev-client`, then open **Settings → Connected accounts → Connect Google**. Test successful linking, cancel, reconnect after revoking the grant in your Google account, disconnect, and relaunch to verify persistence.

Until the Android HTTPS App Link and Google Cloud clients are configured, Google linking remains unavailable on that platform. `.env` is ignored by git; only public client IDs belong there. Never put a Google client secret in the app or its environment.

## What is intentionally NOT built yet

- Notifications, widgets, HealthKit, calendar integration, voice, camera
- Charts, analytics, any insights logic, AI/LLM calls, recommendation rules
- Timetable entry UI, habit creation/editing UI, check-in UI (all screens are placeholders)
- State management, forms, UI kits, extra animation libraries (beyond what Expo Router ships with)
- An Evolve user account, backend, or sync
- Nothing to configure: the "Developer" card on Settings (Insert sample data / Wipe data / row counts) exists only to prove the DB layer works and will be removed when real screens arrive (until then, pressing "Insert sample data" twice errors on the unique daily check-in — shown in the status line, by design).

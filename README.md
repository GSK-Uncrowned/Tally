# Tally

A sewing log and income tracker for small sewing businesses that still keep their records in a notebook. Instead of counting finished pieces by hand, the owner opens the app and sees what was sewn, who sewed it, who it was for, and how much everyone earned.

Built for a real family sewing business and used by it. Plain HTML, CSS, and JavaScript with a Supabase backend. No framework and no build step.

**Live demo:** [add link]

**Screenshots:** [add 4–6 screenshots here: Log, Salary, Suppliers, Finance, Setup, and the loading screen]

---

## What it does

- **Log:** a newest-first list of everything sewn, grouped by day. Work is added through a step-by-step card wizard (supplier, item, color, size, quantity). Price and sewer pay are applied automatically from Setup. An optional date change supports backdated work. Deleting an entry asks for confirmation first.
- **Salary:** a compact card for each sewer showing the week's salary. Tapping a card shows that sewer's logs, grouped by supplier.
- **Suppliers:** a weekly total for each supplier. Tapping one shows the work broken down by sewer, with items sorted by name.
- **Finance:** a month calendar showing income per day. Tapping a week or a day shows its breakdown by supplier, with income, what was paid to sewers, and profit.
- **Finalize week:** on the Salary tab the owner can finalize a week. That locks its entries, saves a detailed payslip for each sewer, and lets everyone download them as images. The owner also gets one detailed report for all sewers, and can reopen the week if something needs fixing.
- **Setup:** manage catalog choices and rates keyed by supplier, item, and size. A "Needs attention" section flags combinations used in entries that don't have a rate yet.
- **Organizations and roles:** signed-in users can create an organization as an owner, or join one as a sewer using an expiring six-digit invite code (also shareable as a QR code). Owners get the full management dashboard. Sewers get private logs, salary, and earnings views.
- **Sign-in:** email and password, plus Google sign-in, with an email confirmation step.
- **Live sync:** with Supabase Realtime, entries, rates, and catalog options stay in sync across open devices.
- **Local mode:** without Supabase configured, the app runs entirely in the browser and saves to localStorage.
- **Design:** black-and-white minimalist, works on phones and desktops, and follows the system light or dark theme. It has a custom hand-drawn tally-marks loading animation and app icon.

---

## Tech

- Plain HTML, CSS, and JavaScript: `index.html`, `style.css`, `app.js`, with the Supabase keys in `config.js`.
- [Supabase](https://supabase.com): Postgres, Auth, Realtime, and row-level security.
- Libraries loaded from CDNs: `@supabase/supabase-js` 2.110.1, `qrcodejs` 1.0.0, and `html5-qrcode` (see "Known limitations").
- Fonts from Google Fonts: DM Sans and Gochi Hand.
- Hosted on Vercel (static hosting). Any static host works.

### Project files

```
index.html               app markup
style.css                all styles, including the loading animation
app.js                   all app logic
config.js                your Supabase keys (not included, you create it)
manifest.webmanifest     app name and icons for "Add to Home screen"
supabase-schema.sql      organizations, roles, invites, and row-level security
supabase-finalize.sql    finalized weeks, saved payslips, and entry locking
assets/                  app icons (favicon, apple-touch-icon, 192 and 512 px)
```

---

## Setup

### 1. Create a Supabase project

Create a project at supabase.com, then in the project settings copy the **Project URL** and the **anon public key**.

### 2. Create the database

1. Create the base tables first: `profiles`, `entries`, `tally_rates`, and `tally_catalog_values`.
   **[Add the SQL for the base tables here, or include it as `supabase-base-tables.sql`. `supabase-schema.sql` expects these tables to already exist.]**
2. Run [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL Editor, then [`supabase-finalize.sql`](./supabase-finalize.sql) for finalized weeks and payslips. It adds:
   - `organizations`, `organization_members`, and `organization_invites` tables
   - organization columns on the base tables
   - functions to create an organization, create an invite, and accept an invite
   - row-level security policies for owners and sewers

### 3. Turn on Realtime

In Supabase, go to Database → Replication and enable Realtime for `entries`, `tally_rates`, and `tally_catalog_values`. Without it the app still works but won't live-update across devices.

### 4. Set up authentication

- **Email/password:** enabled by default. Choose whether to require email confirmation (the app handles both).
- **Google sign-in:** create OAuth credentials in Google Cloud Console and add them under Authentication → Providers → Google in Supabase.
- Under Authentication → URL Configuration, add your site URL and any redirect URLs.

### 5. Add your keys

Create a file named `config.js` next to `index.html`:

```js
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
```

Leave `config.js` out (or empty) to run in local-only mode.

### 6. Run or deploy

- **Locally:** open `index.html` in a browser, or serve the folder with any static server.
- **Deploy:** upload the folder to any static host. On Vercel, import the repository and deploy with no build command. File and folder names are case-sensitive on most hosts.

The `index.html` includes a Vercel Analytics script (`/_vercel/insights/script.js`). It only works on Vercel and is safe to remove.

---

## Installing on a phone

The app has a web manifest and icons, so on Android it can be added to the home screen from the browser menu, and on iPhone from Safari's Share menu. It opens full screen with its own icon. There is no offline support yet (see below), and the cloud mode needs an internet connection.

---

## Current status and known limitations

This is a working app that is used in production by one small business. Be aware of the following before relying on it:

- **Entries can't be edited yet.** Owners can delete and re-add them.
- **No offline mode.** Cloud mode needs a connection, and error messages for lost connections can be clearer.
- **Security review not done.** Row-level security policies are in `supabase-schema.sql`, but they haven't had an independent review. Invite codes are six digits and expire after 24 hours, so an owner should review the invite flow before using it with sensitive data.
- **Unpinned dependency:** `html5-qrcode` is loaded from unpkg without a version number. Pin a version before relying on it.
- **No automated tests.**
- **Single file of logic:** all app code is in one `app.js`, which is simple to host but large to navigate.

## Roadmap ideas

- Edit existing entries
- Search, CSV export, and an on-screen weekly summary
- Offline support
- Clearer error and offline messages
- Independent security review of the database rules

---

## What's included in a sale

**[Fill this in before sharing. For example: source code only; source code plus the domain; or code plus the Supabase project. Existing business data belongs to the current users and should not be transferred without their permission.]**

## License

**[Add your license or terms here, for example "All rights reserved" or a specific license, and say whether the buyer can resell or rebrand the app.]**

## About this project

I built this with help from Claude (Anthropic) while learning JavaScript and Supabase, and I used it as a way to practice reading, changing, and understanding the code, not just generating it.

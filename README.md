# Tally

A simple sewing log and income tracker for small sewing businesses that still keep their records in a notebook. Instead of counting finished pieces by hand, the owner can open the app and see what was sewn, who sewed it, who it was for, and how much everyone earned.

Built for a real family sewing business. Work in progress.

## What it does

- **Log:** a newest-first list of everything sewn, grouped by day. Add work through a step-by-step card wizard for supplier, item, color, size, and quantity. Price and sewer pay are applied from Setup, and an optional date change supports backdated work. Deleting an entry asks for confirmation first.
- **Salary:** a compact card for each sewer showing the week's salary. Tap a card to see that sewer's logs, grouped by supplier.
- **Suppliers:** a weekly total for each supplier. Tap one to see the work broken down by sewer, with items sorted by name.
- **Finance:** a month calendar showing income per day. Tap a week or a day to see its breakdown by supplier. It shows income, what was paid to sewers, and profit.
- **Setup:** manage catalog choices and rates keyed by supplier, item, and size. A Needs attention section flags combinations used in entries that do not have a rate yet.
- **Demo data:** a button on the Log tab previews sample entries so you can try everything without saving them to the cloud, and exits back to your records.
- **Organizations:** signed-in users can create an organization as an owner or join one as a sewer through an expiring six-digit invitation code. Owners get the management dashboard; sewers get private logs, salary, and earnings finance views.

It uses a black-and-white minimalist design, works on phones and desktops, and follows the system light or dark theme.

## Tech

- Plain HTML, CSS, and JavaScript, split into `index.html`, `style.css`, and `app.js`, with the Supabase keys in `config.js`. No framework and no build step.
- When Supabase is configured, data is saved online so signed-in users can share it. Without Supabase configuration, data is saved in the browser (localStorage).
- In cloud mode, the app uses Supabase Realtime to keep entries, rates, and catalog options synchronized across open devices. Realtime must be enabled for those tables in the Supabase project.
- Apply [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL editor before using organization onboarding. It adds organization membership, six-digit invite functions, and role-aware RLS.

## Run it

1. Create a `config.js` next to `index.html` that defines `SUPABASE_URL` and `SUPABASE_ANON_KEY` (use the values from your Supabase project settings). Skip this to run in local-only mode.
2. Open `index.html` in a browser, or serve the folder with any static server.

## Roadmap

- Edit existing entries
- Search, CSV export, and an on-screen weekly summary (no printing needed)
- Install on a phone like an app
- More stability work: clearer error and offline messages, and a security review of the database rules
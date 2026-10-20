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

It uses a black-and-white minimalist design, works on phones and desktops, and follows the system light or dark theme.

## Tech

- Plain HTML, CSS, and JavaScript in a single file. No framework and no build step.
- When Supabase is configured, data is saved online so signed-in users can share it. Without Supabase configuration, data is saved in the browser (localStorage).
- In cloud mode, the app uses Supabase Realtime to keep entries, rates, and catalog options synchronized across open devices. Realtime must be enabled for those tables in the Supabase project.

## Run it

Open `index.html` in any browser.

## Roadmap

- Add shared sewer/profile management
- Edit existing entries
- Fewer fields per entry, with saved price and pay rates
- Pick suppliers, items, colors, and sizes from a list so names stay consistent
- Search, CSV export, and a printable weekly salary slip
- Install on a phone like an app

## About this project

I built this with help from Claude (Anthropic) while learning JavaScript and Supabase. I'm using it to practice reading, changing, and understanding the code, not just generating it.

# Tally

A simple sewing log and income tracker for small sewing businesses that still keep their records in a notebook. Instead of counting finished pieces by hand, the owner can open the app and see what was sewn, who sewed it, who it was for, and how much everyone earned.

Built for a real family sewing business. Work in progress.

## What it does

- **Log:** a newest-first list of everything sewn, grouped by day. Each entry records the supplier (who the cloth came from), the item, color, size, quantity, price per piece, who sewed it, and the sewer's pay per piece. Use the arrows to move between weeks. Deleting an entry asks for confirmation first.
- **Salary:** a compact card for each sewer showing the week's salary. Tap a card to see that sewer's logs, grouped by supplier.
- **Suppliers:** a weekly total for each supplier. Tap one to see the work broken down by sewer, with items sorted by name.
- **Finance:** a month calendar showing income per day. Tap a week or a day to see its breakdown by supplier. It shows income, what was paid to sewers, and profit.
- **Demo data:** a button on the Log tab loads sample entries so you can try everything, and clears them again.

It uses a black-and-white minimalist design, works on phones and desktops, and follows the system light or dark theme.

## Tech

- Plain HTML, CSS, and JavaScript in a single file. No framework and no build step.
- Data is currently saved in the browser (localStorage), so it stays on one device.

## Run it

Open `index.html` in any browser.

## Roadmap

- Save data online with Supabase so everyone sees the same records
- Sign up and log in, so each sewer's entries are tagged automatically
- Edit existing entries
- Fewer fields per entry, with saved pay rates
- Pick suppliers and sewers from a list so names stay consistent
- Search, CSV export, and a printable weekly salary slip
- Install on a phone like an app

## About this project

I built this with help from Claude (Anthropic) while learning JavaScript and Supabase. I'm using it to practice reading, changing, and understanding the code, not just generating it.

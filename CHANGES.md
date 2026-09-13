# What changed

Drop these files into your project, overwriting the existing ones at the
same paths (folder structure is preserved in the zip):

```
admin-dashboard.html
assets/css/style.css
assets/js/i18n.js
assets/js/admin.js
api/get_orders.php
api/update_order_status.php   ← new file
```

No other files were touched — `api/db.php`, `api/create_order.php`,
`api/get_order.php`, `home.html`, `cart.html`, etc. are unchanged.

## 1. Admin logo fix
`assets/css/style.css` had `.os-topbar .os-logo-mark { height: 40px; ... }`,
which only applies inside the storefront navbar (`.os-topbar`). The admin
dashboard's navbar uses a different class (`.admin-topbar`), so that rule
never matched there and the logo rendered at its full native pixel size.
The rule is now just `.os-logo-mark { ... }`, so it applies everywhere the
class is used.

## 2. Order statuses
Orders can now move through five statuses: **Pending → Confirmed →
Shipped → Delivered**, with **Returned** available at any point. Change a
status right from the dropdown in the orders table, or from the order
details modal — both call the new endpoint:

- `api/update_order_status.php` (POST `{ id, status }`, admin-only, and
  validates `status` against the five allowed values server-side).

The status dropdown is color-coded (amber/lime/blue/green/terracotta) so
the table stays scannable. The stat tiles at the top now show a live count
for all five statuses.

## 3. Filtering
`api/get_orders.php` gained two new filters, combinable with the existing
country/city/search-by-ID ones:
- `status` — exact match against one of the five statuses.
- `date_from` / `date_to` — inclusive range compared against the order's
  date (ignores time of day), using `YYYY-MM-DD` values from the two new
  date pickers in the dashboard.

## 4. Excel export
An "Export to Excel" button generates a real `.xlsx` file (not just CSV)
directly in the browser using the SheetJS library (loaded from
`cdn.jsdelivr.net`, the same way Bootstrap already is — no PHP dependency,
no server round-trip beyond the orders you've already loaded). It exports
exactly what's currently on screen, so if you filter to "Shipped" orders
from last week before exporting, that's what lands in the spreadsheet.
The sheet includes order #, customer, city, country, both phone numbers,
itemized products, total, status, and date, with sensible column widths
and a frozen header row.

`api/get_orders.php` now also returns each order's item list and
secondary phone number (previously only fetched one-order-at-a-time via
`get_order.php`), so the export doesn't need N extra requests.

# Organic Special

A simple bilingual (English / Arabic) storefront for organic seeds and
healthy products, plus an admin dashboard to view incoming orders.
Built with Bootstrap 5 + vanilla JavaScript on the front end, and a
small PHP + SQLite backend — no Node.js, no external accounts, no
monthly cost.

## What's in here

```
organic-special/
├── index.html              Splash screen → language selection (entry point)
├── home.html                Product catalog + product detail popup
├── cart.html                Cart + checkout (delivery details) form
├── admin-login.html         Admin sign-in
├── admin-dashboard.html     Admin: view / filter / search orders
├── assets/
│   ├── css/style.css        All styling (colors, fonts, layout)
│   ├── js/                  i18n, product data, cart, page logic
│   └── img/logo.png         Your logo
├── api/                     PHP backend (talks to the SQLite database)
│   ├── config.php           Sessions + JSON response helpers
│   ├── db.php                Opens/creates database/store.db and its tables
│   ├── create_order.php      POST — save a new order
│   ├── admin_login.php       POST — admin sign in
│   ├── admin_logout.php      POST — admin sign out
│   ├── check_session.php     GET  — is an admin currently logged in?
│   ├── get_orders.php        GET  — list orders (filters: country, city, id search)
│   └── get_order.php         GET  — one order's full details
├── database/
│   ├── store.db              Created automatically on first request
│   └── .htaccess             Blocks direct web access to store.db (Apache)
└── tools/
    └── set_admin_password.php   CLI helper to create/change an admin login
```

## Requirements

- PHP 7.4 or later, with the `pdo_sqlite` extension enabled (this ships
  enabled by default on almost every PHP install and every shared host).
- No database server to install — SQLite is just a single file
  (`database/store.db`) that PHP creates automatically the first time
  any page hits the API.
- No Node.js needed anywhere.

## Running it locally

From the project folder:

```
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser. The built-in PHP
server serves the HTML/CSS/JS files *and* runs the `/api/*.php`
scripts, so everything works from one command.

## Deploying to your hosting

Works on ordinary shared hosting (cPanel, etc.) — no special
configuration needed:

1. Upload the entire `organic-special` folder to your hosting (e.g.
   into `public_html`), keeping the folder structure intact.
2. Make sure the `database/` folder is writable by PHP (usually fine
   by default; if orders fail to save, set its permissions to `755`
   or `775`).
3. Visit your domain — the splash screen should appear, and
   `store.db` will be created automatically the first time someone
   places an order or you log in as admin.
4. Visit `yourdomain.com/admin-login.html` to reach the dashboard.

**Important — change the default admin password before going live.**
The very first time the database is created, one admin account is
seeded automatically so you can log in:

- Phone: `01000000000`
- Password: `Organic@123`

Change it with the included helper (run once, from the project root):

```
php tools/set_admin_password.php 01012345678 "YourNewPassword123"
```

This updates the phone number and password together. If your host
doesn't give you command-line/SSH access, run this same command on
your own computer (with PHP installed) against a local copy of the
project, then upload the resulting `database/store.db` file to your
host, overwriting the old one.

## How data is stored

- **Products** are not stored in the database — they're a static list
  in `assets/js/products.js` (English + Arabic name, description,
  price, unit, category, and a Bootstrap Icon). To add or edit a
  product, edit that file directly.
- **Orders** are saved to SQLite the moment a customer confirms
  checkout (`api/create_order.php`), and shown in the admin dashboard
  via `api/get_orders.php` / `get_order.php`.
- **The cart** itself lives only in the customer's browser
  (`localStorage`) until they check out — nothing is sent to the
  server until they press "Confirm order".
- **Admin login** is a simple, direct check against the `admins`
  table: the password is never stored in plain text (it's hashed with
  PHP's `password_hash`), and `password_verify` checks it on login.

## Notes on security & scaling

- All database queries use prepared statements, so user input can't
  be used to tamper with the database (SQL injection).
- The admin dashboard endpoints (`get_orders.php`, `get_order.php`)
  check for a valid logged-in session on every request — not just in
  the page's JavaScript — so they can't be reached by guessing a URL.
- `database/.htaccess` stops people from downloading `store.db`
  directly if you're on Apache. If your host uses **Nginx** instead,
  add a rule to your server config to deny access to `/database/`, or
  simply move the `database/` folder one level above your public web
  folder and update the path in `api/db.php` accordingly.
- SQLite is a great fit for a small shop with light-to-moderate order
  volume. If you later need multiple admins with roles, very high
  order volume, or multiple servers, you'd want to move to a
  proper client-server database (e.g. MySQL/Postgres) — the code is
  structured so only `api/db.php`'s connection logic would need to
  change, not the rest of the app.

## Language & RTL

- Language choice is asked once on the splash screen and remembered
  (`localStorage`); it can be changed again anytime from the globe
  icon in the top bar on the homepage.
- Arabic renders fully right-to-left: Bootstrap's RTL build is loaded
  automatically, and one font (Cairo) is used for both languages so
  the look stays consistent when switching.

## Cities

The city dropdown lists Egypt's 27 governorates
(`assets/js/egypt-cities.js`). Country is fixed to Egypt and cannot be
changed by the customer, per the current requirements.

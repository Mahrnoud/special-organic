# Organic Special

A simple bilingual (English / Arabic) storefront for organic seeds and
healthy products, plus an admin dashboard to view incoming orders.
Built with Bootstrap 5 + vanilla JavaScript on the front end, and a
small PHP + SQLite backend — no Node.js, no external accounts, no
monthly cost.

## What's in here

```
organic-special/
├── index.html              Three-second splash → storefront (entry point)
├── home.html                Product catalog + product detail popup
├── cart.html                Cart + checkout (delivery details) form
├── admin-login.html         Admin sign-in
├── admin-dashboard.html     Admin: view / filter / search orders
├── assets/
│   ├── css/style.css        All styling (colors, fonts, layout)
│   ├── js/                  i18n, product data, cart, page logic
│   └── img/                 Logo and optional photos
│       ├── logo.png         Your logo
│       ├── products/        Product photos named by catalog ID
│       └── hero/            Slide backgrounds and second-slide photo
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

## Adding your photos

Copy your photos into the folders below. Filenames are case-sensitive on
most hosting servers. Missing or failed product photos show the existing
icons; missing slide backgrounds leave the original white background.

| File | Used for |
| --- | --- |
| `assets/img/products/1.jpg` | Chia Seeds |
| `assets/img/products/2.jpg` | Flax Seeds |
| `assets/img/products/3.jpg` | Black Seeds (Nigella), including the current featured slide |
| `assets/img/products/4.jpg` | Pumpkin Seeds |
| `assets/img/products/5.jpg` | Sunflower Seeds |
| `assets/img/products/6.jpg` | Sesame Seeds |
| `assets/img/products/7.jpg` | Green Tea |
| `assets/img/products/8.jpg` | Quinoa |
| `assets/img/hero/slide-1-bg.jpg` | Featured slide background |
| `assets/img/hero/slide-2-bg.jpg` | Second slide background |
| `assets/img/hero/slide-2-image.jpg` | Second slide's small photo inside the organic shape |

Product photos are shared by cards, popups, bundle
offer, and cart. The bundle shows the tea and chia photos side by side;
it does not need a separate image file.

Use square product photos (about 800 × 800 pixels), a square second-slide
photo, and wide backgrounds (about 1600 × 1000 pixels). Product card and popup photos,
shaped slide photos, and backgrounds are cropped to fill their image areas.
Bundle offer and cart photos are contained within their boxes.
Keep the main subject near the center. Backgrounds
have a light overlay so headings and buttons stay readable.

To use PNG, WebP, or another filename, change the product's `image` value
in `assets/js/products.js`, the second slide's image path next to
`brandMedia` in `assets/js/main.js`, or the `--os-slide-background` URLs
in `assets/css/style.css`. CSS URLs are relative to the CSS folder
(`../img/hero/...`); JavaScript paths are relative to the page
(`assets/img/...`). Set a product's `image` to an empty string to use
only its icon. Homepage slide photos and product actions are now managed separately in **Admin dashboard → Site content**.

## Optional ingredients and product galleries

Edit the relevant entry in `assets/js/products.js`. Add `ingredients_en`
and `ingredients_ar` to show an Ingredients section under the description.
Leave both out (or empty) to hide the section for that product.

```js
ingredients_en: 'Green tea leaves.',
ingredients_ar: 'أوراق الشاي الأخضر.',
image: 'assets/img/products/7.jpg',
images: ['assets/img/products/7-detail.jpg', 'assets/img/products/7-pack.jpg'],
```

Copy the actual extra photos to these paths before adding them. The existing
`image` is the cover, followed by `images` in order; duplicate paths are ignored.
With two or more photos, the detail popup shows arrows, dots, keyboard navigation,
and swipe controls. With one photo it keeps the original static cover. Cards and
cart thumbnails keep the cover (or the first `images` entry if `image` is omitted).
Green Tea uses the existing homepage tea/seeds photo as a second slide for
previewing the gallery; replace its `images` entry with another tea photo when ready.
The bundle uses its existing tea/chia photos to demonstrate the slider; its card
and cart thumbnail still show the pair side by side. Green Tea and the bundle
have ingredient text based on their existing catalog descriptions.

Each product card has an Add to cart button that adds one unit and shows the
confirmation toast without opening the details popup. Click the photo or product
name to view the details instead. Both actions work with the keyboard.

## Shipping and delivery details

In the admin dashboard, open **Shipping**, select a city, enter its fee in
EGP, and click **Save shipping fee**. Zero means free shipping; decimal fees
are supported. All 27 cities initially use the previous 50 EGP fee until edited.
Rates are stored in SQLite and survive refreshes and server restarts.

Checkout loads the saved rates and immediately updates shipping and the total
when the customer selects a city, in English or Arabic. Until a city is selected,
the total stays pending. If rates cannot be loaded, checkout asks the customer to
refresh instead of assuming a fee.

The server calculates shipping from the selected city's saved rate. If the fee
changes while a customer is checking out, they must review the updated total and
confirm again. Existing orders keep their original shipping fees and totals;
admin details and Excel exports retain the saved shipping breakdown.

Name, city, address, and WhatsApp number are required; the additional number is
optional. Address is limited to 500 characters. Existing SQLite databases upgrade
automatically on the next API request, without replacing historical orders.

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
php -S localhost:8000 tools/router.php
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

- **Products and sizes** are stored in SQLite. Manage reusable bilingual sizes in
  **Admin → Sizes**, and assign sizes with their individual prices in **Products**.
  Catalog seed files are only used when creating the initial database.
- **Orders** are saved to SQLite the moment a customer confirms
  checkout (`api/create_order.php`), and shown in the admin dashboard
  via `api/get_orders.php` / `get_order.php`. Order numbers start at **999**,
  then continue with 1000, 1001, and so on. Initialization preserves existing
  orders and never moves the order sequence backward.
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

- The entry page shows the existing three-second splash and then opens the store
  automatically. Arabic is the default, including direct visits to inner pages.
  The globe switcher still lets customers choose English or Arabic and remembers
  their preference in `localStorage`. The homepage keeps its loading animation.
- Arabic renders fully right-to-left: Bootstrap's RTL build is loaded
  automatically, and one font (Cairo) is used for both languages so
  the look stays consistent when switching.

## Cities

The city dropdown lists Egypt's 27 governorates
(`assets/js/egypt-cities.js`). Country is fixed to Egypt and cannot be
changed by the customer, per the current requirements.


## Managing site content

Open **Admin dashboard → Site content** to edit the storefront in English and Arabic:

- **Homepage slider:** add up to 10 slides, reorder or remove them (keep at least one), upload a small image or enter its URL/path, and edit the tag, title, description, and button text. A button can open a web URL / store section or add a selected product to the cart. Product slides use live catalog prices and are hidden when that product is archived.
- **About:** edit the heading, introduction, tag, and all three feature cards.
- **Contact & shared social links:** edit the heading, description, WhatsApp button text, contact image, phone, email, Facebook, Instagram, WhatsApp URL, address, and business hours. Shared details appear in the existing header, contact, trust bar, and footer locations on both the home and cart pages. Blank optional links are hidden.
- **Discover card & footer:** edit the Discover card copy and the footer description.

Click **Save site content**, then refresh the storefront to see the changes. Image uploads accept JPG, PNG, WebP, and GIF up to 5 MB, subject to PHP's upload limit. Uploading an image updates the draft; click Save to publish it. Both English and Arabic slide titles/button labels are required. The editor warns before leaving with unsaved changes and refuses to overwrite a newer save from another window.

Content is stored in the existing SQLite database in `site_content`. The table is created automatically without replacing existing products, orders, or shipping rates. `api/content-seed.json` supplies the initial copy only; edit published content through the dashboard. Back up `database/store.db` and `assets/img/uploads/` together. The public `GET api/get_content.php` endpoint supplies content; saving and image uploads require an admin session.


## Sizes and product prices

Create and edit shared size labels in **Admin → Sizes** (both English and Arabic
are required). Archive a size to stop assigning it to additional products; products
already using that size remain available. Restore it to allow new assignments.

In **Products**, add one or more size/price rows using the dropdown. Every row must
have a different size and a price between 0 and 1,000,000 EGP. Removing a row stops
selling that product-size combination without altering past orders. A product must
keep at least one size. Prices belong to the product-size combination, not to the
shared size itself.

Single-size products support direct Add to cart. Products with several sizes show
“From” pricing and open a popup to choose a size, including promotional buttons.
Different sizes appear as separate cart lines. Checkout validates the selected size
and current price on the server; saved orders retain bilingual size labels and
prices even after products or shared size labels change. Bundle savings comparisons
are hidden when multiple sizes make the comparison ambiguous.

Existing products automatically migrate to one size at their existing price, with
IDs preserved. Old browser carts migrate when there is exactly one available size;
ambiguous or unavailable items are removed with a notice to select them again.

API additions (admin session required except the public catalog and checkout):

- `GET api/get_sizes.php`: returns all size records, including archived sizes.
- `POST api/save_size.php`: `{id?: number, label_en: string, label_ar: string}`.
- `POST api/archive_size.php`: `{id: number, archived: boolean}`.
- `api/save_product.php`: accepts `variants: [{size_id, price}]` instead of free-text
  units and one price. The existing multipart photo upload is still supported.
- `api/get_products.php`: includes `variants` with size IDs, labels, and prices.
  Compatibility `price` and `unit_en`/`unit_ar` fields describe the lowest-priced size.
- Checkout items include `{id, size_id, qty, price}`. Legacy requests without a size
  are accepted only for products with one available size.

## Order status and deletion

Statuses are Pending, Confirmed, Shipped, Delivered, Completed, and Returned. Status
changes remain available individually, in details, and through bulk updates.

Orders store stable city and country codes, while the dashboard translates location,
status, product, and size snapshots into the admin's selected language. The same
language is used by Excel exports. Customer-entered names, addresses, and phone
numbers are preserved exactly as submitted. Legacy English and Arabic city values are
normalized automatically during upgrades and remain accepted by checkout clients.

Use **Delete** in an order row to move it to **Deleted orders**, preserving its
status, customer details, items, and totals. The Deleted view supports filtering,
viewing, exporting, and restoring. Restore returns the order to Active orders with
its original status. Deleted orders cannot receive status updates, and a bulk
update containing a deleted order fails without partially changing other orders.

`GET api/get_orders.php?deleted=0|1` selects Active (default) or Deleted orders.
Statistics cover that selected view before other filters; exports use the current
filtered list and include purchased sizes and deletion dates.
`POST api/delete_order.php` and `POST api/restore_order.php` accept `{id: number}`.
There is no permanent-delete dashboard action or automatic order-clearing migration.

## Verification

Run backend integration tests against an isolated temporary store:

```sh
python3 -m unittest discover -s tests -v
node --test tests/test_storefront.cjs
```

Back up `database/store.db` before upgrading; migrations run automatically on the
next API request. The development test-order reset is separate from migrations
and is not run when installing or upgrading the application.

## Clean page URLs

Public pages use `/home`, `/cart`, `/admin-login`, and `/admin-dashboard`.
The root `/` keeps the splash screen and then opens `/home`. Production redirects
legacy `.html` links and trailing-slash page URLs permanently to the clean URL,
preserving query strings and browser fragments. API and asset paths are unchanged.
Use the local router in the development command above to support the same routes.

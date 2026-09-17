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

Product photos are shared by cards, popups, the featured slide, bundle
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
only its icon. Changing `OS_FEATURED_PRODUCT_ID` also changes its photo.

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

Every nonempty order has a fixed **50 EGP shipping fee**, added once to the
items subtotal. Checkout displays subtotal, shipping, and total in both languages.
Name, city, address, and WhatsApp number are required and marked with a red `*`;
the additional number remains optional. Address is limited to 500 characters.

The API validates the address and adds the 50 EGP fee itself. Saved orders,
admin details, and Excel exports include the address and shipping breakdown.
Existing SQLite databases upgrade automatically on the next API request;
historical orders retain their totals, with a zero shipping fee and blank address.
The fixed fee is defined in `assets/js/cart.js` and `api/create_order.php`;
update both together if the delivery price changes.

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
  price, unit, category, photo path, and a fallback Bootstrap Icon). To add or edit a
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

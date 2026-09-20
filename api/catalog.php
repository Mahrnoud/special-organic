<?php
declare(strict_types=1);

/** Seed once, preserving the original IDs used by saved carts and orders. */
function initialize_products(PDO $pdo): void
{
    if ($pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")->fetch()) {
        return;
    }
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        // Another request may have completed the migration while we waited.
        if (!$pdo->query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")->fetch()) {
            $pdo->exec("CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name_en TEXT NOT NULL, name_ar TEXT NOT NULL,
                unit_en TEXT NOT NULL DEFAULT '', unit_ar TEXT NOT NULL DEFAULT '',
                desc_en TEXT NOT NULL DEFAULT '', desc_ar TEXT NOT NULL DEFAULT '',
                ingredients_en TEXT NOT NULL DEFAULT '', ingredients_ar TEXT NOT NULL DEFAULT '',
                price REAL NOT NULL CHECK(price >= 0),
                image TEXT NOT NULL DEFAULT '', images TEXT NOT NULL DEFAULT '[]',
                icon TEXT NOT NULL DEFAULT 'bi-basket3-fill',
                archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0, 1)),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )");
            $seed = json_decode(file_get_contents(__DIR__ . '/catalog-seed.json'), true, 512, JSON_THROW_ON_ERROR);
            $stmt = $pdo->prepare('INSERT INTO products
                (id, category, name_en, name_ar, unit_en, unit_ar, desc_en, desc_ar,
                 ingredients_en, ingredients_ar, price, image, images, icon)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            foreach ($seed as $p) {
                $stmt->execute([$p['id'], $p['category'], $p['name_en'], $p['name_ar'],
                    $p['unit_en'], $p['unit_ar'], $p['desc_en'], $p['desc_ar'],
                    $p['ingredients_en'] ?? '', $p['ingredients_ar'] ?? '', $p['price'],
                    $p['image'] ?? '', json_encode($p['images'] ?? []), $p['icon']]);
            }
        }
        $pdo->exec('COMMIT');
    } catch (Throwable $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

function product_response(array $product): array
{
    $product['id'] = (int)$product['id'];
    $product['price'] = (float)$product['price'];
    $product['archived'] = (bool)$product['archived'];
    $product['images'] = json_decode($product['images'], true) ?: [];
    $product['variants'] = product_variants(get_db(), $product['id']);
    if ($product['variants']) {
        $first = $product['variants'][0];
        $product['price'] = $first['price'];
        $product['unit_en'] = $first['label_en'];
        $product['unit_ar'] = $first['label_ar'];
    }
    return $product;
}

function valid_product_image(string $path): bool
{
    if ($path === '') return true;
    if (preg_match('~^assets/img/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp|gif)$~i', $path)
        && strpos($path, '..') === false) return true;
    return filter_var($path, FILTER_VALIDATE_URL) !== false
        && in_array(strtolower((string)parse_url($path, PHP_URL_SCHEME)), ['https', 'http'], true);
}

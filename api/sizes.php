<?php
declare(strict_types=1);

/** Idempotent upgrade, serialized so concurrent requests cannot seed twice. */
function initialize_store_updates(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
    if ($pdo->query("SELECT 1 FROM schema_migrations WHERE name = 'sizes-and-deleted-orders-v1'")->fetchColumn()) return;
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        if (!$pdo->query("SELECT 1 FROM schema_migrations WHERE name = 'sizes-and-deleted-orders-v1'")->fetchColumn()) {
            $pdo->exec("CREATE TABLE sizes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label_en TEXT NOT NULL, label_ar TEXT NOT NULL,
                archived INTEGER NOT NULL DEFAULT 0 CHECK(archived IN (0,1)),
                UNIQUE(label_en, label_ar)
            )");
            $pdo->exec("CREATE TABLE product_sizes (
                product_id INTEGER NOT NULL REFERENCES products(id),
                size_id INTEGER NOT NULL REFERENCES sizes(id),
                price REAL NOT NULL CHECK(price >= 0 AND price <= 1000000),
                active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
                PRIMARY KEY(product_id, size_id)
            )");
            $insertSize = $pdo->prepare('INSERT OR IGNORE INTO sizes(label_en, label_ar) VALUES (?, ?)');
            $findSize = $pdo->prepare('SELECT id FROM sizes WHERE label_en = ? AND label_ar = ?');
            $insertVariant = $pdo->prepare('INSERT INTO product_sizes(product_id, size_id, price) VALUES (?, ?, ?)');
            foreach ($pdo->query('SELECT id, unit_en, unit_ar, price FROM products')->fetchAll(PDO::FETCH_ASSOC) as $p) {
                $labels = [$p['unit_en'] ?: 'Standard pack', $p['unit_ar'] ?: 'عبوة عادية'];
                $insertSize->execute($labels);
                $findSize->execute($labels);
                $insertVariant->execute([$p['id'], $findSize->fetchColumn(), $p['price']]);
            }
            $columns = array_column($pdo->query('PRAGMA table_info(orders)')->fetchAll(PDO::FETCH_ASSOC), 'name');
            if (!in_array('deleted_at', $columns, true)) $pdo->exec('ALTER TABLE orders ADD COLUMN deleted_at TEXT DEFAULT NULL');
            $pdo->exec("INSERT INTO schema_migrations(name) VALUES ('sizes-and-deleted-orders-v1')");
        }
        $pdo->exec('COMMIT');
    } catch (Throwable $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

function product_variants(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT ps.size_id, s.label_en, s.label_ar, ps.price, s.archived
        FROM product_sizes ps JOIN sizes s ON s.id = ps.size_id
        WHERE ps.product_id = ? AND ps.active = 1 ORDER BY ps.price, ps.size_id');
    $stmt->execute([$id]);
    return array_map(function ($v) {
        return ['size_id' => (int)$v['size_id'], 'label_en' => $v['label_en'], 'label_ar' => $v['label_ar'],
            'price' => (float)$v['price'], 'archived' => (bool)$v['archived']];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}

/** Called under the product save transaction. Archived assignments can only be retained. */
function validate_product_variants(PDO $pdo, ?int $productId, $variants): array
{
    if (!is_array($variants) || count($variants) < 1 || count($variants) > 100) {
        throw new InvalidArgumentException('Choose between 1 and 100 sizes with a price for each.');
    }
    $seen = [];
    $result = [];
    $lookup = $pdo->prepare('SELECT s.*, COALESCE(ps.active, 0) AS assigned FROM sizes s
        LEFT JOIN product_sizes ps ON ps.size_id = s.id AND ps.product_id = ? WHERE s.id = ?');
    foreach ($variants as $v) {
        $sizeId = is_array($v) ? ($v['size_id'] ?? null) : null;
        $price = is_array($v) ? ($v['price'] ?? null) : null;
        if (!is_int($sizeId) || $sizeId < 1 || isset($seen[$sizeId])) throw new InvalidArgumentException('Choose a different valid size for each row.');
        if ((!is_int($price) && !is_float($price)) || !is_finite((float)$price) || $price < 0 || $price > 1000000) {
            throw new InvalidArgumentException('Enter a price between 0 and 1,000,000 EGP for each size.');
        }
        $lookup->execute([$productId, $sizeId]);
        $size = $lookup->fetch(PDO::FETCH_ASSOC);
        if (!$size || ($size['archived'] && !$size['assigned'])) throw new InvalidArgumentException('This size is unavailable for new assignments. Refresh the size list.');
        $seen[$sizeId] = true;
        $result[] = ['size_id' => $sizeId, 'price' => round($price, 2), 'label_en' => $size['label_en'], 'label_ar' => $size['label_ar']];
    }
    usort($result, fn($a, $b) => ($a['price'] <=> $b['price']) ?: ($a['size_id'] <=> $b['size_id']));
    return $result;
}

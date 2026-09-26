<?php
declare(strict_types=1);

function shipping_cities(): array
{
    return json_decode(file_get_contents(__DIR__ . '/shipping-cities.json'), true, 512, JSON_THROW_ON_ERROR);
}

function initialize_shipping(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS shipping_rates (
        city TEXT PRIMARY KEY,
        fee REAL NOT NULL CHECK (fee >= 0 AND fee <= 1000000)
    )');
    $insert = $pdo->prepare('INSERT OR IGNORE INTO shipping_rates (city, fee) VALUES (?, 50)');
    foreach (shipping_cities() as $city) $insert->execute([$city['en']]);
}

/** Add stable location identifiers and normalize every recognizable legacy order. */
function initialize_order_locations(PDO $pdo): void
{
    $migration = 'order-location-codes-v1';
    $pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
    if ($pdo->query("SELECT 1 FROM schema_migrations WHERE name = '$migration'")->fetchColumn()) return;

    $pdo->exec('BEGIN IMMEDIATE');
    try {
        if (!$pdo->query("SELECT 1 FROM schema_migrations WHERE name = '$migration'")->fetchColumn()) {
            $columns = array_column($pdo->query('PRAGMA table_info(orders)')->fetchAll(PDO::FETCH_ASSOC), 'name');
            if (!in_array('city_code', $columns, true)) $pdo->exec('ALTER TABLE orders ADD COLUMN city_code TEXT');
            if (!in_array('country_code', $columns, true)) $pdo->exec("ALTER TABLE orders ADD COLUMN country_code TEXT NOT NULL DEFAULT 'EG'");

            $update = $pdo->prepare("UPDATE orders SET city_code = ?, country_code = 'EG' WHERE id = ?");
            foreach ($pdo->query('SELECT id, city, city_code FROM orders')->fetchAll(PDO::FETCH_ASSOC) as $order) {
                $city = shipping_city((string)($order['city_code'] ?: $order['city']));
                if ($city) $update->execute([$city['code'], $order['id']]);
            }
            $pdo->prepare('INSERT INTO schema_migrations(name) VALUES (?)')->execute([$migration]);
        }
        $pdo->exec('COMMIT');
    } catch (Throwable $e) {
        $pdo->exec('ROLLBACK');
        throw $e;
    }
}

function shipping_city(string $name): ?array
{
    foreach (shipping_cities() as $city) {
        if ($name === $city['code'] || $name === $city['en'] || $name === $city['ar']) return $city;
    }
    return null;
}

function shipping_rates(PDO $pdo): array
{
    $fees = $pdo->query('SELECT city, fee FROM shipping_rates')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_map(fn($city) => array_merge($city, ['fee' => (float)$fees[$city['en']]]), shipping_cities());
}

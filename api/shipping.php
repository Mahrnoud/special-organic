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

function shipping_city(string $name): ?array
{
    foreach (shipping_cities() as $city) {
        if ($name === $city['en'] || $name === $city['ar']) return $city;
    }
    return null;
}

function shipping_rates(PDO $pdo): array
{
    $fees = $pdo->query('SELECT city, fee FROM shipping_rates')->fetchAll(PDO::FETCH_KEY_PAIR);
    return array_map(fn($city) => array_merge($city, ['fee' => (float)$fees[$city['en']]]), shipping_cities());
}

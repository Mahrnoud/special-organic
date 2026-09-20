<?php
declare(strict_types=1);

function initialize_content(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS site_content (id INTEGER PRIMARY KEY CHECK (id = 1), content TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1)');
    if ($pdo->query('SELECT id FROM site_content WHERE id = 1')->fetch()) return;
    $seed = json_decode(file_get_contents(__DIR__ . '/content-seed.json'), true);
    $featured = $pdo->query('SELECT * FROM products WHERE id = 3')->fetch(PDO::FETCH_ASSOC);
    if ($featured) {
        $seed['slides'][0]['image'] = $featured['image'];
        foreach (['en', 'ar'] as $lang) {
            $seed['slides'][0]['title'][$lang] = $featured['name_' . $lang];
            $seed['slides'][0]['description'][$lang] = $featured['desc_' . $lang];
        }
    }
    $stmt = $pdo->prepare('INSERT OR IGNORE INTO site_content (id, content) VALUES (1, ?)');
    $stmt->execute([json_encode($seed, JSON_UNESCAPED_UNICODE)]);
}

function site_content(PDO $pdo): array
{
    $row = $pdo->query('SELECT content, revision FROM site_content WHERE id = 1')->fetch(PDO::FETCH_ASSOC);
    return ['content' => json_decode($row['content'], true), 'revision' => (int)$row['revision']];
}

function content_error(string $field): void
{
    json_response(['success' => false, 'message' => 'Please check ' . $field . '.'], 422);
}

function content_string($value, string $field, int $limit = 2000): string
{
    if (!is_string($value) || mb_strlen(trim($value)) > $limit) content_error($field);
    return trim($value);
}

function content_translation($value, string $field, bool $required = false): array
{
    if (!is_array($value)) content_error($field);
    $result = [];
    foreach (['en', 'ar'] as $lang) {
        $result[$lang] = content_string($value[$lang] ?? null, "$field ($lang)", 5000);
        if ($required && $result[$lang] === '') content_error("$field ($lang)");
    }
    return $result;
}

function content_url(string $value, bool $local = false): bool
{
    if (preg_match('/[\x00-\x20\x7f\\\\]/', $value)) return false;
    if (filter_var($value, FILTER_VALIDATE_URL) && in_array(strtolower((string)parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true)) return true;
    return $local && (bool)preg_match('~^(?:#[a-zA-Z][a-zA-Z0-9_-]*|(?:/|/?(?:home|cart|index)(?:\.html)?)(?:#[a-zA-Z][a-zA-Z0-9_-]*)?)$~', $value);
}

function validate_content(array $body, PDO $pdo): array
{
    $slides = $body['slides'] ?? null;
    if (!is_array($slides) || array_keys($slides) !== range(0, count($slides) - 1) || count($slides) < 1 || count($slides) > 10) content_error('slider (1–10 slides)');
    $result = ['slides' => [], 'texts' => [], 'contact' => []];
    foreach ($slides as $i => $slide) {
        if (!is_array($slide)) content_error('slide');
        $clean = [];
        foreach (['tag', 'title', 'description', 'button'] as $key) {
            $clean[$key] = content_translation($slide[$key] ?? null, 'slide ' . ($i + 1) . ' ' . $key, $key === 'title' || $key === 'button');
        }
        $clean['image'] = content_string($slide['image'] ?? null, 'slide image');
        if (!valid_product_image($clean['image'])) content_error('slide image URL');
        $clean['href'] = content_string($slide['href'] ?? null, 'button link');
        if (!content_url($clean['href'], true)) content_error('button link (website URL or page section)');
        $clean['product_id'] = $slide['product_id'] ?? null;
        if (!is_int($clean['product_id']) || $clean['product_id'] < 0) content_error('slide product');
        if ($clean['product_id']) {
            $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ?');
            $stmt->execute([$clean['product_id']]);
            if (!$stmt->fetch()) content_error('slide product');
        }
        $result['slides'][] = $clean;
    }
    $seed = json_decode(file_get_contents(__DIR__ . '/content-seed.json'), true);
    foreach (array_keys($seed['texts']) as $key) {
        $result['texts'][$key] = content_translation($body['texts'][$key] ?? null, $key);
    }
    $contact = $body['contact'] ?? null;
    if (!is_array($contact)) content_error('contact details');
    foreach (['phone', 'email', 'facebook', 'instagram', 'whatsapp', 'image'] as $key) {
        $result['contact'][$key] = content_string($contact[$key] ?? null, $key);
    }
    $c = $result['contact'];
    if ($c['phone'] !== '' && !preg_match('/^\+?[0-9 ()-]{7,30}$/', $c['phone'])) content_error('phone number');
    if ($c['email'] !== '' && !filter_var($c['email'], FILTER_VALIDATE_EMAIL)) content_error('email');
    foreach (['facebook', 'instagram', 'whatsapp'] as $key) {
        if ($c[$key] !== '' && !content_url($c[$key])) content_error($key . ' URL');
    }
    if (!valid_product_image($c['image'])) content_error('contact image URL');
    foreach (['address', 'hours'] as $key) $result['contact'][$key] = content_translation($contact[$key] ?? null, $key);
    return $result;
}

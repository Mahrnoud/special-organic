<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_once __DIR__ . '/shipping.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}
$body = read_json_body();
$city = is_string($body['city'] ?? null) ? shipping_city(trim($body['city'])) : null;
$fee = $body['fee'] ?? null;
if (!$city) json_response(['success' => false, 'message' => 'Please select a valid city.'], 422);
if ((!is_int($fee) && !is_float($fee)) || !is_finite((float)$fee) || $fee < 0 || $fee > 1000000) {
    json_response(['success' => false, 'message' => 'Enter a shipping fee between 0 and 1,000,000 EGP.'], 422);
}
$pdo = get_db();
$stmt = $pdo->prepare('UPDATE shipping_rates SET fee = ? WHERE city = ?');
$stmt->execute([round($fee, 2), $city['en']]);
json_response(['success' => true, 'rates' => shipping_rates($pdo)]);

<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$body = read_json_body();

$fullName = trim((string)($body['full_name'] ?? ''));
$city = trim((string)($body['city'] ?? ''));
$address = trim((string)($body['address'] ?? ''));
$country = trim((string)($body['country'] ?? 'Egypt')) ?: 'Egypt';
$mobileWhatsapp = trim((string)($body['mobile_whatsapp'] ?? ''));
$mobileAdditional = isset($body['mobile_additional']) && $body['mobile_additional'] !== null
    ? trim((string)$body['mobile_additional'])
    : null;
$items = $body['items'] ?? [];
$shippingFee = 50.0; // Fixed per order, enforced independently of the browser.

// --- Server-side validation (never trust the browser alone) ---
$mobileRegex = '/^01[0125][0-9]{8}$/';

if ($fullName === '' || mb_strlen($fullName) > 120) {
    json_response(['success' => false, 'message' => 'Please enter a valid full name.'], 422);
}
if ($city === '') {
    json_response(['success' => false, 'message' => 'Please select a city.'], 422);
}
if ($address === '' || mb_strlen($address) > 500) {
    json_response(['success' => false, 'message' => 'Please enter a delivery address (up to 500 characters).'], 422);
}
if (!preg_match($mobileRegex, $mobileWhatsapp)) {
    json_response(['success' => false, 'message' => 'Please enter a valid Egyptian WhatsApp number.'], 422);
}
if ($mobileAdditional !== null && $mobileAdditional !== '' && !preg_match($mobileRegex, $mobileAdditional)) {
    json_response(['success' => false, 'message' => 'The additional number is not a valid Egyptian mobile number.'], 422);
}
if (!is_array($items) || count($items) === 0) {
    json_response(['success' => false, 'message' => 'Your cart is empty.'], 422);
}

// Recompute the total from the submitted items rather than trusting the client's number.
$recomputedTotal = 0.0;
$cleanItems = [];
foreach ($items as $item) {
    $qty = (int)($item['qty'] ?? 0);
    $price = (float)($item['price'] ?? 0);
    $name = trim((string)($item['name'] ?? ''));
    if ($qty <= 0 || $price < 0 || $name === '') {
        json_response(['success' => false, 'message' => 'Invalid item in cart.'], 422);
    }
    $recomputedTotal += $qty * $price;
    $cleanItems[] = ['id' => $item['id'] ?? null, 'name' => $name, 'qty' => $qty, 'price' => $price];
}

$pdo = get_db();
$stmt = $pdo->prepare('
    INSERT INTO orders (full_name, city, country, address, mobile_whatsapp, mobile_additional, items, total_amount, shipping_fee, status)
    VALUES (:full_name, :city, :country, :address, :mobile_whatsapp, :mobile_additional, :items, :total_amount, :shipping_fee, :status)
');
$stmt->execute([
    ':full_name' => $fullName,
    ':city' => $city,
    ':address' => $address,
    ':country' => $country,
    ':mobile_whatsapp' => $mobileWhatsapp,
    ':mobile_additional' => ($mobileAdditional !== '' ? $mobileAdditional : null),
    ':items' => json_encode($cleanItems, JSON_UNESCAPED_UNICODE),
    ':total_amount' => $recomputedTotal + $shippingFee,
    ':shipping_fee' => $shippingFee,
    ':status' => 'pending',
]);

json_response(['success' => true, 'order_id' => (int)$pdo->lastInsertId()]);

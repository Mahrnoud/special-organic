<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$body = read_json_body();

$fullName = trim((string)($body['full_name'] ?? ''));
$city = trim((string)($body['city_code'] ?? $body['city'] ?? ''));
$address = trim((string)($body['address'] ?? ''));
$mobileWhatsapp = trim((string)($body['mobile_whatsapp'] ?? ''));
$mobileAdditional = isset($body['mobile_additional']) && $body['mobile_additional'] !== null
    ? trim((string)$body['mobile_additional'])
    : null;
$items = $body['items'] ?? [];

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

// Read availability and prices under the same write lock as order creation.
$pdo = get_db();
$pdo->exec('BEGIN IMMEDIATE');
$deliveryCity = shipping_city($city);
if (!$deliveryCity) {
    $pdo->exec('ROLLBACK');
    json_response(['success' => false, 'message' => 'Please select a valid city.'], 422);
}
$rate = $pdo->prepare('SELECT fee FROM shipping_rates WHERE city = ?');
$rate->execute([$deliveryCity['en']]);
$shippingFee = (float)$rate->fetchColumn();
// Existing clients may omit the quote; the saved fee always comes from the database.
if (array_key_exists('shipping_fee', $body) &&
    (!is_numeric($body['shipping_fee']) || abs((float)$body['shipping_fee'] - $shippingFee) > 0.001)) {
    $pdo->exec('ROLLBACK');
    json_response(['success' => false, 'code' => 'shipping_changed', 'message' => 'The shipping fee has changed. Please review the updated total and confirm again.'], 409);
}
$lookup = $pdo->prepare('SELECT * FROM products WHERE id = ? AND archived = 0');
$recomputedTotal = 0.0;
$cleanItems = [];
$lang = ($body['language'] ?? 'ar') === 'ar' ? 'ar' : 'en';
foreach ($items as $item) {
    $qty = is_array($item) ? ($item['qty'] ?? null) : null;
    $id = is_array($item) ? ($item['id'] ?? null) : null;
    if (!is_int($qty) || $qty < 1 || $qty > 999 || !is_int($id) || $id < 1) {
        $pdo->exec('ROLLBACK');
        json_response(['success' => false, 'message' => 'Invalid item or quantity in cart.'], 422);
    }
    $lookup->execute([$id]);
    $product = $lookup->fetch(PDO::FETCH_ASSOC);
    if (!$product) {
        $pdo->exec('ROLLBACK');
        json_response(['success' => false, 'message' => 'A product in your cart is no longer available. Refresh your cart before ordering.'], 409);
    }
    $sizeId = $item['size_id'] ?? null;
    $variants = product_variants($pdo, $id);
    // Older clients can only be resolved when the product has exactly one size.
    if ($sizeId === null && count($variants) === 1) $sizeId = $variants[0]['size_id'];
    $variant = null;
    foreach ($variants as $candidate) {
        if (is_int($sizeId) && $candidate['size_id'] === $sizeId) $variant = $candidate;
    }
    if (!$variant) {
        $pdo->exec('ROLLBACK');
        json_response(['success' => false, 'message' => 'The selected size is unavailable. Refresh your cart and select a size again.'], 409);
    }
    $price = $variant['price'];
    // Ask the customer to review changes instead of silently charging a new price.
    if (!isset($item['price']) || !is_numeric($item['price']) || abs((float)$item['price'] - $price) > 0.001) {
        $pdo->exec('ROLLBACK');
        json_response(['success' => false, 'message' => 'A product price has changed. Refresh your cart to review the new total.'], 409);
    }
    $recomputedTotal += $qty * $price;
    $cleanItems[] = ['id' => $id, 'name' => $product['name_' . $lang],
        'name_en' => $product['name_en'], 'name_ar' => $product['name_ar'], 'qty' => $qty, 'price' => $price,
        'size_id' => $sizeId, 'size_en' => $variant['label_en'], 'size_ar' => $variant['label_ar']];
}

$stmt = $pdo->prepare('
    INSERT INTO orders (full_name, city, city_code, country, country_code, address, mobile_whatsapp, mobile_additional, items, total_amount, shipping_fee, status)
    VALUES (:full_name, :city, :city_code, :country, :country_code, :address, :mobile_whatsapp, :mobile_additional, :items, :total_amount, :shipping_fee, :status)
');
$stmt->execute([
    ':full_name' => $fullName,
    ':city' => $deliveryCity['en'],
    ':city_code' => $deliveryCity['code'],
    ':address' => $address,
    ':country' => 'Egypt',
    ':country_code' => 'EG',
    ':mobile_whatsapp' => $mobileWhatsapp,
    ':mobile_additional' => ($mobileAdditional !== '' ? $mobileAdditional : null),
    ':items' => json_encode($cleanItems, JSON_UNESCAPED_UNICODE),
    ':total_amount' => $recomputedTotal + $shippingFee,
    ':shipping_fee' => $shippingFee,
    ':status' => 'pending',
]);

$orderId = (int)$pdo->lastInsertId();
$pdo->exec('COMMIT');
json_response(['success' => true, 'order_id' => $orderId]);

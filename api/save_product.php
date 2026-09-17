<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_once __DIR__ . '/catalog.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$body = isset($_POST['product']) ? json_decode($_POST['product'], true) : read_json_body();
if (!is_array($body)) json_response(['success' => false, 'message' => 'Invalid product.'], 422);
$id = $body['id'] ?? null;
if ($id !== null && (!is_int($id) || $id < 1)) {
    json_response(['success' => false, 'message' => 'Invalid product ID.'], 422);
}
$fields = ['name_en' => 160, 'name_ar' => 160, 'unit_en' => 120, 'unit_ar' => 120,
    'desc_en' => 5000, 'desc_ar' => 5000, 'ingredients_en' => 2000, 'ingredients_ar' => 2000,
    'category' => 20, 'image' => 2000, 'icon' => 80];
$product = [];
foreach ($fields as $field => $limit) {
    $value = $body[$field] ?? ($field === 'icon' ? 'bi-basket3-fill' : '');
    if (!is_string($value) || mb_strlen(trim($value)) > $limit) {
        json_response(['success' => false, 'message' => 'Invalid field: ' . $field], 422);
    }
    $product[$field] = trim($value);
}
if ($product['name_en'] === '' || $product['name_ar'] === '') {
    json_response(['success' => false, 'message' => 'Enter the product name in English and Arabic.'], 422);
}
if (!in_array($product['category'], ['seeds', 'tea', 'grains', 'bundle'], true)) {
    json_response(['success' => false, 'message' => 'Choose a valid category.'], 422);
}
$price = $body['price'] ?? null;
if ((!is_int($price) && !is_float($price)) || !is_finite((float)$price) || $price < 0 || $price > 1000000) {
    json_response(['success' => false, 'message' => 'Enter a price between 0 and 1,000,000 EGP.'], 422);
}
$product['price'] = round($price, 2);
$images = $body['images'] ?? [];
if (!is_array($images) || count($images) > 12 || !valid_product_image($product['image'])) {
    json_response(['success' => false, 'message' => 'Use an image URL or a path under assets/img (up to 12 gallery images).'], 422);
}
foreach ($images as $path) {
    if (!is_string($path) || strlen($path) > 2000 || !valid_product_image($path)) {
        json_response(['success' => false, 'message' => 'Invalid gallery image path.'], 422);
    }
}
if (!preg_match('/^bi-[a-z0-9-]+$/', $product['icon'])) {
    json_response(['success' => false, 'message' => 'Invalid fallback icon.'], 422);
}
$product['images'] = json_encode(array_values(array_unique(array_filter($images))), JSON_UNESCAPED_UNICODE);
$pdo = get_db();
if ($id !== null) {
    $check = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) json_response(['success' => false, 'message' => 'Product not found.'], 404);
}

// Only verified raster images are accepted; generated filenames cannot execute as PHP.
$uploadedPath = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES['photo'];
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
        json_response(['success' => false, 'message' => 'Upload a JPG, PNG, WebP or GIF image up to 5 MB (and within the server upload limit).'], 422);
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extensions[$mime]) || !getimagesize($file['tmp_name'])) {
        json_response(['success' => false, 'message' => 'Please upload a valid JPG, PNG, WebP or GIF image.'], 422);
    }
    $directory = __DIR__ . '/../assets/img/uploads';
    if (!is_dir($directory) && !mkdir($directory, 0755, true)) throw new RuntimeException('Cannot create upload directory.');
    $product['image'] = 'assets/img/uploads/' . bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    $uploadedPath = __DIR__ . '/../' . $product['image'];
    if (!move_uploaded_file($file['tmp_name'], $uploadedPath)) throw new RuntimeException('Cannot save image.');
}
try {
    $columns = array_keys($product);
    if ($id === null) {
        $stmt = $pdo->prepare('INSERT INTO products (' . implode(', ', $columns) . ') VALUES (' . implode(', ', array_fill(0, count($columns), '?')) . ')');
        $stmt->execute(array_values($product));
        $id = (int)$pdo->lastInsertId();
    } else {
        $assignments = implode(', ', array_map(fn($key) => $key . ' = ?', $columns));
        $stmt = $pdo->prepare('UPDATE products SET ' . $assignments . ', updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([...array_values($product), $id]);
    }
} catch (Throwable $e) {
    if ($uploadedPath) unlink($uploadedPath);
    throw $e;
}
json_response(['success' => true, 'product_id' => $id]);

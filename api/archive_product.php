<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
$body = read_json_body();
$id = $body['id'] ?? null;
$archived = $body['archived'] ?? null;
if (!is_int($id) || $id < 1 || !is_bool($archived)) {
    json_response(['success' => false, 'message' => 'Invalid product ID or archive state.'], 422);
}
$stmt = get_db()->prepare('UPDATE products SET archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
$stmt->execute([(int)$archived, $id]);
if (!$stmt->rowCount()) json_response(['success' => false, 'message' => 'Product not found.'], 404);
json_response(['success' => true, 'product_id' => $id, 'archived' => $archived]);

<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
$body = read_json_body();
$id = $body['id'] ?? null;
if (!is_int($id) || $id < 1) json_response(['success' => false, 'message' => 'Invalid order ID.'], 422);
$stmt = get_db()->prepare('UPDATE orders SET deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP) WHERE id = ?');
$stmt->execute([$id]);
if (!$stmt->rowCount()) json_response(['success' => false, 'message' => 'Order not found.'], 404);
json_response(['success' => true, 'order_id' => $id]);

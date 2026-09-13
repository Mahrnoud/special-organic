<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned'];

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
$status = trim((string)($body['status'] ?? ''));

if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid order id.'], 422);
}
if (!in_array($status, $allowedStatuses, true)) {
    json_response(['success' => false, 'message' => 'Invalid status.'], 422);
}

$pdo = get_db();

$check = $pdo->prepare('SELECT id FROM orders WHERE id = :id LIMIT 1');
$check->execute([':id' => $id]);
if (!$check->fetch()) {
    json_response(['success' => false, 'message' => 'Order not found.'], 404);
}

$stmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
$stmt->execute([':status' => $status, ':id' => $id]);

json_response(['success' => true, 'order_id' => $id, 'status' => $status]);

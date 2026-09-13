<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

require_admin();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    json_response(['success' => false, 'message' => 'Invalid order id.'], 422);
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $id]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    json_response(['success' => false, 'message' => 'Order not found.'], 404);
}

$order['items'] = json_decode($order['items'], true) ?: [];

json_response(['success' => true, 'order' => $order]);

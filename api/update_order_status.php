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
$ids = $body['ids'] ?? [$body['id'] ?? null];
$status = $body['status'] ?? '';
if (!is_array($ids) || count($ids) === 0 || count($ids) > 5000) {
    json_response(['success' => false, 'message' => 'Select between 1 and 5,000 orders.'], 422);
}
foreach ($ids as $id) {
    if (!is_int($id) || $id <= 0) json_response(['success' => false, 'message' => 'Invalid order id.'], 422);
}
$ids = array_values(array_unique($ids));
if (!in_array($status, $allowedStatuses, true)) {
    json_response(['success' => false, 'message' => 'Invalid status.'], 422);
}

$pdo = get_db();
$pdo->exec('BEGIN IMMEDIATE');
try {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $check = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE id IN ($placeholders)");
    $check->execute($ids);
    if ((int)$check->fetchColumn() !== count($ids)) {
        $pdo->exec('ROLLBACK');
        json_response(['success' => false, 'message' => 'One or more orders no longer exist. Refresh and try again.'], 404);
    }
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id IN ($placeholders)");
    $stmt->execute([$status, ...$ids]);
    $pdo->exec('COMMIT');
} catch (Throwable $e) {
    $pdo->exec('ROLLBACK');
    throw $e;
}
json_response(['success' => true, 'order_ids' => $ids, 'order_id' => $ids[0], 'updated_count' => count($ids), 'status' => $status]);

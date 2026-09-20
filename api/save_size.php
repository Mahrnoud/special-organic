<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
$body = read_json_body();
$id = $body['id'] ?? null;
if ($id !== null && (!is_int($id) || $id < 1)) json_response(['success' => false, 'message' => 'Invalid size ID.'], 422);
$labels = [];
foreach (['label_en', 'label_ar'] as $key) {
    $value = $body[$key] ?? null;
    if (!is_string($value) || trim($value) === '' || mb_strlen(trim($value)) > 120) {
        json_response(['success' => false, 'message' => 'Enter both size labels (up to 120 characters each).'], 422);
    }
    $labels[] = trim($value);
}
$pdo = get_db();
if ($id !== null) {
    $check = $pdo->prepare('SELECT id FROM sizes WHERE id = ?');
    $check->execute([$id]);
    if (!$check->fetch()) json_response(['success' => false, 'message' => 'Size not found.'], 404);
}
try {
    if ($id === null) {
        $pdo->prepare('INSERT INTO sizes(label_en, label_ar) VALUES (?, ?)')->execute($labels);
        $id = (int)$pdo->lastInsertId();
    } else {
        $pdo->prepare('UPDATE sizes SET label_en = ?, label_ar = ? WHERE id = ?')->execute([...$labels, $id]);
    }
} catch (PDOException $e) {
    if ($e->getCode() !== '23000') throw $e;
    json_response(['success' => false, 'message' => 'This size already exists.'], 422);
}
json_response(['success' => true, 'size_id' => $id]);

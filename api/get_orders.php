<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

require_admin();

$pdo = get_db();

$country = trim((string)($_GET['country'] ?? ''));
$city = trim((string)($_GET['city'] ?? ''));
$q = trim((string)($_GET['q'] ?? ''));

$where = [];
$params = [];

if ($country !== '') {
    $where[] = 'country = :country';
    $params[':country'] = $country;
}
if ($city !== '') {
    $where[] = 'city = :city';
    $params[':city'] = $city;
}
if ($q !== '') {
    // Partial match on the order id, e.g. "12" matches order #12 and #120.
    $where[] = "CAST(id AS TEXT) LIKE :q";
    $params[':q'] = '%' . $q . '%';
}

$whereSql = count($where) > 0 ? ('WHERE ' . implode(' AND ', $where)) : '';

$stmt = $pdo->prepare("
    SELECT id, full_name, city, country, mobile_whatsapp, total_amount, status, created_at
    FROM orders
    $whereSql
    ORDER BY created_at DESC, id DESC
");
$stmt->execute($params);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Overall stats reflect ALL orders, not just the filtered view.
$stats = $pdo->query("
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
    FROM orders
")->fetch(PDO::FETCH_ASSOC);

json_response([
    'success' => true,
    'orders' => $orders,
    'stats' => [
        'total' => (int)($stats['total'] ?? 0),
        'pending' => (int)($stats['pending'] ?? 0),
        'confirmed' => (int)($stats['confirmed'] ?? 0),
    ],
]);

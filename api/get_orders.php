<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

require_admin();

$pdo = get_db();

$country = trim((string)($_GET['country'] ?? ''));
$city = trim((string)($_GET['city'] ?? ''));
$status = trim((string)($_GET['status'] ?? ''));
$dateFrom = trim((string)($_GET['date_from'] ?? ''));
$dateTo = trim((string)($_GET['date_to'] ?? ''));
$q = trim((string)($_GET['q'] ?? ''));

$allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'returned'];
$dateRegex = '/^\d{4}-\d{2}-\d{2}$/';

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
if ($status !== '' && in_array($status, $allowedStatuses, true)) {
    $where[] = 'status = :status';
    $params[':status'] = $status;
}
if ($dateFrom !== '' && preg_match($dateRegex, $dateFrom)) {
    // created_at is stored as 'YYYY-MM-DD HH:MM:SS'; date() extracts just the day.
    $where[] = 'date(created_at) >= :date_from';
    $params[':date_from'] = $dateFrom;
}
if ($dateTo !== '' && preg_match($dateRegex, $dateTo)) {
    $where[] = 'date(created_at) <= :date_to';
    $params[':date_to'] = $dateTo;
}
if ($q !== '') {
    // Partial match on the order id, e.g. "12" matches order #12 and #120.
    $where[] = "CAST(id AS TEXT) LIKE :q";
    $params[':q'] = '%' . $q . '%';
}

$whereSql = count($where) > 0 ? ('WHERE ' . implode(' AND ', $where)) : '';

// Includes mobile_additional + items so the admin dashboard can build a
// full Excel export without an extra request per order.
$stmt = $pdo->prepare("
    SELECT id, full_name, city, country, address, mobile_whatsapp, mobile_additional, items, total_amount, shipping_fee, status, created_at
    FROM orders
    $whereSql
    ORDER BY created_at DESC, id DESC
");
$stmt->execute($params);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$order) {
    $order['items'] = json_decode($order['items'], true) ?: [];
}
unset($order);

// Overall stats reflect ALL orders, not just the filtered view.
$stats = $pdo->query("
    SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS returned
    FROM orders
")->fetch(PDO::FETCH_ASSOC);

json_response([
    'success' => true,
    'orders' => $orders,
    'stats' => [
        'total' => (int)($stats['total'] ?? 0),
        'pending' => (int)($stats['pending'] ?? 0),
        'confirmed' => (int)($stats['confirmed'] ?? 0),
        'shipped' => (int)($stats['shipped'] ?? 0),
        'delivered' => (int)($stats['delivered'] ?? 0),
        'returned' => (int)($stats['returned'] ?? 0),
    ],
]);

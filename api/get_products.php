<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

header('Cache-Control: no-store');
$adminView = ($_GET['admin'] ?? '') === '1';
if ($adminView) require_admin();
$products = get_db()->query('SELECT * FROM products ' . ($adminView ? '' : 'WHERE archived = 0 ') . 'ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
json_response(['success' => true, 'products' => array_map('product_response', $products)]);

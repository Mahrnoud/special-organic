<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';
require_admin();
header('Cache-Control: no-store');
$sizes = get_db()->query('SELECT * FROM sizes ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($sizes as &$size) {
    $size['id'] = (int)$size['id'];
    $size['archived'] = (bool)$size['archived'];
}
unset($size);
json_response(['success' => true, 'sizes' => $sizes]);

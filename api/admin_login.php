<?php
declare(strict_types=1);
require __DIR__ . '/config.php';
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$body = read_json_body();
$phone = trim((string)($body['phone'] ?? ''));
$password = (string)($body['password'] ?? '');

if ($phone === '' || $password === '') {
    json_response(['success' => false, 'message' => 'Phone number and password are required.'], 422);
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, password_hash FROM admins WHERE phone = :phone LIMIT 1');
$stmt->execute([':phone' => $phone]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

// Same generic message whether the phone or the password was wrong,
// so a caller can't use this endpoint to discover valid phone numbers.
if (!$admin || !password_verify($password, $admin['password_hash'])) {
    json_response(['success' => false, 'message' => 'Incorrect phone number or password.'], 401);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = (int)$admin['id'];

json_response(['success' => true]);

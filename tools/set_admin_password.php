<?php
/**
 * One-off command-line helper to create a new admin, or update an
 * existing one's password. Never expose this file on the web — it
 * lives outside /api on purpose and is meant to be run like this:
 *
 *   php tools/set_admin_password.php 01012345678 "My$trongPassword1"
 *
 * Run it from the project's root folder (where /database lives),
 * either on your own machine or over SSH on your host, then (if you
 * ran it locally) upload the resulting database/store.db file.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('This script can only be run from the command line.');
}

require __DIR__ . '/../api/db.php';

$phone = $argv[1] ?? null;
$password = $argv[2] ?? null;

if (!$phone || !$password) {
    fwrite(STDERR, "Usage: php tools/set_admin_password.php <phone> <new-password>\n");
    exit(1);
}

if (strlen($password) < 8) {
    fwrite(STDERR, "Please choose a password with at least 8 characters.\n");
    exit(1);
}

$pdo = get_db();
$hash = password_hash($password, PASSWORD_DEFAULT);

$existing = $pdo->prepare('SELECT id FROM admins WHERE phone = :phone');
$existing->execute([':phone' => $phone]);

if ($existing->fetch()) {
    $stmt = $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE phone = :phone');
    $stmt->execute([':hash' => $hash, ':phone' => $phone]);
    echo "Updated password for admin with phone $phone.\n";
} else {
    $stmt = $pdo->prepare('INSERT INTO admins (phone, password_hash) VALUES (:phone, :hash)');
    $stmt->execute([':phone' => $phone, ':hash' => $hash]);
    echo "Created new admin with phone $phone.\n";
}

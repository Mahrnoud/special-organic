<?php
/**
 * Shared bootstrap for every API endpoint:
 * - starts a secure-ish session (used for the admin login)
 * - forces JSON responses
 * - turns PHP warnings into a clean JSON error instead of raw HTML
 */

declare(strict_types=1);

ini_set('display_errors', '0'); // never leak PHP errors as HTML into a JSON response
error_reporting(E_ALL);

session_set_cookie_params([
    'lifetime' => 60 * 60 * 8, // 8 hours
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

header('Content-Type: application/json; charset=utf-8');

/** Send a JSON response and stop. */
function json_response(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Read and decode a JSON request body. */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Stop the request unless an admin is logged in. */
function require_admin(): void
{
    if (empty($_SESSION['admin_id'])) {
        json_response(['success' => false, 'message' => 'Not authenticated.'], 401);
    }
}

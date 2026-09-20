<?php
/** Development routing: php -S localhost:8000 tools/router.php */
declare(strict_types=1);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
if (preg_match('~^/(home|cart|admin-login|admin-dashboard)(?:\.html|/)$~', $path, $match)) {
    header('Location: /' . $match[1] . ($query !== null ? '?' . $query : ''), true, 301);
    return;
}
if (in_array($path, ['/index', '/index/', '/index.html'], true)) {
    header('Location: /' . ($query !== null ? '?' . $query : ''), true, 301);
    return;
}
if (preg_match('~^/(home|cart|admin-login|admin-dashboard)$~', $path, $match)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile(__DIR__ . '/../' . $match[1] . '.html');
    return;
}
return false;

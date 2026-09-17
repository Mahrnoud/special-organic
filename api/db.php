<?php
/**
 * Opens (and, on first run, creates) the SQLite database file at
 * /database/store.db and upgrades its tables without replacing existing data.
 *
 * SQLite needs nothing installed beyond PHP's pdo_sqlite extension
 * (enabled by default on almost every PHP install/shared host).
 */

declare(strict_types=1);

function get_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbPath = __DIR__ . '/../database/store.db';
    $isNew = !file_exists($dbPath);

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS admins (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            phone         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name          TEXT NOT NULL,
            city               TEXT NOT NULL,
            country            TEXT NOT NULL DEFAULT 'Egypt',
            address            TEXT NOT NULL DEFAULT '',
            mobile_whatsapp    TEXT NOT NULL,
            mobile_additional  TEXT,
            items              TEXT NOT NULL,
            total_amount       REAL NOT NULL,
            shipping_fee       REAL NOT NULL DEFAULT 0,
            status             TEXT NOT NULL DEFAULT 'pending',
            created_at         TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Upgrade existing stores without changing historical orders or totals.
    $orderColumns = array_column($pdo->query('PRAGMA table_info(orders)')->fetchAll(PDO::FETCH_ASSOC), 'name');
    if (!in_array('address', $orderColumns, true)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN address TEXT NOT NULL DEFAULT ''");
    }
    if (!in_array('shipping_fee', $orderColumns, true)) {
        $pdo->exec('ALTER TABLE orders ADD COLUMN shipping_fee REAL NOT NULL DEFAULT 0');
    }

    if ($isNew) {
        // Seed one default admin so the dashboard is reachable on first run.
        // CHANGE THIS PASSWORD immediately after your first login — see README.
        $stmt = $pdo->prepare('INSERT INTO admins (phone, password_hash) VALUES (:phone, :hash)');
        $stmt->execute([
            ':phone' => '01000000000',
            ':hash' => password_hash('Organic@123', PASSWORD_DEFAULT),
        ]);
    }

    require_once __DIR__ . '/catalog.php';
    initialize_products($pdo);

    return $pdo;
}

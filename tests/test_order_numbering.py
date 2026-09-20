"""Check order numbering in an isolated database, including server restarts."""
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]


class OrderNumberingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='organic-order-numbering-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / 'api', self.root / 'api')
        (self.root / 'database').mkdir()
        self.initialize()
        self.db = sqlite3.connect(self.root / 'database/store.db')
        self.addCleanup(self.db.close)

    def initialize(self):
        subprocess.run(['php', '-r', 'require "api/db.php"; get_db();'],
                       cwd=self.root, check=True, capture_output=True, text=True)

    def create_order(self):
        with self.db:
            order = self.db.execute('''INSERT INTO orders
                (full_name, city, mobile_whatsapp, items, total_amount)
                VALUES ('Numbering test', 'Cairo', '01000000000', '[]', 0)''')
        return order.lastrowid

    def test_first_order_and_continuation_after_restart(self):
        self.assertEqual(self.create_order(), 999)
        self.initialize()
        self.assertEqual(self.create_order(), 1000)

    def test_upgrade_preserves_existing_orders(self):
        with self.db:
            self.db.execute("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'orders'")
        self.assertEqual(self.create_order(), 1)
        self.initialize()
        self.assertEqual(self.db.execute('SELECT id FROM orders').fetchall(), [(1,)])
        self.assertEqual(self.create_order(), 999)

    def test_does_not_reuse_deleted_order_numbers(self):
        with self.db:
            self.db.execute("UPDATE sqlite_sequence SET seq = 1200 WHERE name = 'orders'")
        self.assertEqual(self.create_order(), 1201)
        with self.db:
            self.db.execute('DELETE FROM orders')
        self.initialize()
        self.assertEqual(self.create_order(), 1202)

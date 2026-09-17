"""Integration checks against a temporary store; never reads/writes the real database.
Run: python3 -m unittest discover -s tests -v
"""
import base64
import http.cookiejar
import json
from pathlib import Path
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]


class AdminIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='organic-admin-tests-')
        cls.root = Path(cls.temp.name)
        shutil.copytree(ROOT / 'api', cls.root / 'api')
        (cls.root / 'database').mkdir()
        # Simulate an existing installation with a historical order and no products table.
        password_hash = subprocess.check_output(['php', '-r', 'echo password_hash("TestPassword123", PASSWORD_DEFAULT);'], text=True)
        with sqlite3.connect(cls.root / 'database/store.db') as db:
            db.execute('CREATE TABLE admins (id INTEGER PRIMARY KEY, phone TEXT, password_hash TEXT)')
            db.execute('INSERT INTO admins VALUES (1, ?, ?)', ('01000000000', password_hash))
            db.execute('''CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, full_name TEXT,
                city TEXT, country TEXT, mobile_whatsapp TEXT, mobile_additional TEXT, items TEXT,
                total_amount REAL, status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)''')
            db.execute('''INSERT INTO orders (full_name, city, country, mobile_whatsapp, items, total_amount, status)
                VALUES ('Historical customer', 'Cairo', 'Egypt', '01000000000', '[{"id":1,"name":"Original name","qty":1,"price":42}]', 42, 'pending')''')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        cls.url = f'http://127.0.0.1:{port}'
        cls.log = open(cls.root / 'server.log', 'w+')
        cls.server = subprocess.Popen(['php', '-S', f'127.0.0.1:{port}', '-t', str(cls.root)], stdout=cls.log, stderr=cls.log)
        cls.client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        for _ in range(60):
            try:
                urllib.request.urlopen(cls.url + '/api/check_session.php', timeout=1).close()
                break
            except (OSError, urllib.error.URLError):
                time.sleep(.05)
        code, data = cls.request('admin_login.php', {'phone': '01000000000', 'password': 'TestPassword123'})
        assert code == 200 and data['success'], data

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate()
        cls.server.wait(timeout=5)
        cls.log.close()
        cls.temp.cleanup()

    @classmethod
    def request(cls, endpoint, body=None, anonymous=False):
        raw = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(cls.url + '/api/' + endpoint, data=raw, headers={'Content-Type': 'application/json'})
        client = urllib.request.build_opener() if anonymous else cls.client
        try:
            with client.open(req, timeout=5) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            return error.code, json.load(error)

    def product(self, **overrides):
        product = dict(name_en='Test tea <b>literal</b>', name_ar='شاي تجريبي', category='tea',
                       unit_en='100g', unit_ar='١٠٠ جرام', price=32.50, images=[], image='')
        product.update(overrides)
        code, data = self.request('save_product.php', product)
        self.assertEqual(code, 200, data)
        return data['product_id'], product

    def order(self, product_id, price=32.50, **overrides):
        payload = dict(full_name='Test customer', city='Cairo', address='Test street',
                       mobile_whatsapp='01000000000', items=[dict(id=product_id, qty=2, price=price, name='Untrusted name')])
        payload.update(overrides)
        return self.request('create_order.php', payload, anonymous=True)

    def test_existing_store_migration_preserves_ids_and_orders(self):
        _, data = self.request('get_products.php?admin=1')
        products = {p['id']: p for p in data['products']}
        self.assertEqual(products[1]['name_en'], 'Chia Seeds')
        self.assertEqual(products[101]['price'], 230)
        self.assertEqual(products[7]['ingredients_en'], 'Green tea leaves.')
        _, data = self.request('get_order.php?id=1')
        self.assertEqual(data['order']['items'][0]['name'], 'Original name')
        self.assertEqual(data['order']['total_amount'], 42)
        self.assertEqual(data['order']['shipping_fee'], 0)

    def test_admin_required(self):
        for endpoint, body in [('save_product.php', {}), ('archive_product.php', {'id': 1, 'archived': True}),
                               ('update_order_status.php', {'ids': [1], 'status': 'shipped'}), ('get_products.php?admin=1', None),
                               ('save_shipping.php', {'city': 'Cairo', 'fee': 10})]:
            self.assertEqual(self.request(endpoint, body, anonymous=True)[0], 401)
        self.assertEqual(self.request('get_products.php', anonymous=True)[0], 200)

    def test_content_persistence_validation_and_conflict(self):
        import copy
        code, original = self.request('get_content.php', anonymous=True)
        self.assertEqual(code, 200)
        self.assertEqual(len(original['content']['slides']), 2)
        content = copy.deepcopy(original['content'])
        content['slides'][1]['title'] = {'en': 'Updated <b>title</b>', 'ar': 'عنوان جديد'}
        content['texts']['about_title'] = {'en': 'Our new story', 'ar': 'قصتنا الجديدة'}
        content['contact'].update(email='store@example.com', facebook='https://facebook.com/example', whatsapp='https://wa.me/201234567890')
        payload = {'content': content, 'revision': original['revision']}
        self.assertEqual(self.request('save_content.php', payload, anonymous=True)[0], 401)
        code, saved = self.request('save_content.php', payload)
        self.assertEqual(code, 200, saved)
        self.assertEqual(saved['content'], content)
        self.assertEqual(self.request('get_content.php', anonymous=True)[1]['content'], content)
        self.assertEqual(self.request('save_content.php', payload)[0], 409)
        self.assertEqual(self.request('save_content.php')[0], 405)
        self.assertEqual(self.request('get_content.php', {})[0], 405)
        for path, value in [
            (('contact', 'facebook'), 'javascript:alert(1)'),
            (('contact', 'instagram'), '//example.com'),
            (('contact', 'whatsapp'), 'https://example.com/\\evil'),
            (('contact', 'email'), 'invalid'),
            (('contact', 'image'), 'assets/img/../../secret.png'),
            (('slides', 0, 'href'), 'data:text/html,bad'),
            (('slides', 0, 'href'), '#[bad'),
            (('slides', 0, 'product_id'), True),
            (('slides', 0, 'product_id'), 999999),
            (('slides', 0, 'title', 'ar'), ''),
            (('slides',), []), (('slides',), content['slides'] * 6),
            (('texts', 'about_title', 'en'), ['wrong type']),
        ]:
            bad = copy.deepcopy(content)
            target = bad
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
            code, error = self.request('save_content.php', {'content': bad, 'revision': saved['revision']})
            self.assertEqual(code, 422, (path, value, error))
        current = self.request('get_content.php')[1]
        self.assertEqual(current['content'], content)
        self.assertEqual(current['revision'], saved['revision'])
        self.assertEqual(self.request('save_content.php', {'content': original['content'], 'revision': saved['revision']})[0], 200)

    def test_content_image_upload(self):
        self.assertEqual(self.request('upload_content_image.php', {}, anonymous=True)[0], 401)
        self.assertEqual(self.request('upload_content_image.php', {})[0], 422)
        image = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        for contents, expected in [(image, 200), (b'<?php echo "bad"; ?>', 422)]:
            boundary = 'ContentImageTest'
            body = (f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n').encode() + contents + f'\r\n--{boundary}--\r\n'.encode()
            req = urllib.request.Request(self.url + '/api/upload_content_image.php', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
            try:
                with self.client.open(req) as response:
                    self.assertEqual(response.status, expected)
                    path = json.load(response)['image']
                    self.assertTrue(path.startswith('assets/img/uploads/'))
                    self.assertTrue((self.root / path).is_file())
            except urllib.error.HTTPError as error:
                self.assertEqual(error.code, expected)

    def test_shipping_rates_and_order_totals(self):
        code, data = self.request('get_shipping.php', anonymous=True)
        self.assertEqual(code, 200)
        self.assertEqual(len(data['rates']), 27)
        self.assertTrue(all(rate['fee'] == 50 for rate in data['rates']))
        product_id, _ = self.product()
        try:
            self.assertEqual(self.request('save_shipping.php', {'city': 'Giza', 'fee': 75.25})[0], 200)
            self.assertEqual(self.request('save_shipping.php', {'city': 'الإسكندرية', 'fee': 0})[0], 200)
            # Repeated requests initialize the schema without overwriting saved rates.
            _, rates = self.request('get_shipping.php', anonymous=True)
            self.assertEqual(next(r['fee'] for r in rates['rates'] if r['en'] == 'Giza'), 75.25)
            for city, fee in [('Giza', 75.25), ('الجيزة', 75.25), ('Alexandria', 0), ('الإسكندرية', 0), ('Cairo', 50)]:
                code, order = self.order(product_id, city=city, shipping_fee=fee, total=1)
                self.assertEqual(code, 200, order)
                _, saved = self.request('get_order.php?id=' + str(order['order_id']))
                self.assertEqual(saved['order']['shipping_fee'], fee)
                self.assertEqual(saved['order']['total_amount'], 65 + fee)
            _, old = self.order(product_id, city='Giza', shipping_fee=75.25)
            self.request('save_shipping.php', {'city': 'Giza', 'fee': 90})
            _, saved = self.request('get_order.php?id=' + str(old['order_id']))
            self.assertEqual(saved['order']['shipping_fee'], 75.25)
            self.assertEqual(saved['order']['total_amount'], 140.25)
            for quote in [75.25, 0, None, True, 'invalid']:
                code, error = self.order(product_id, city='Giza', shipping_fee=quote)
                self.assertEqual(code, 409)
                self.assertEqual(error['code'], 'shipping_changed')
            self.assertEqual(self.order(product_id, city='Giza', shipping_fee=90)[0], 200)
            self.assertEqual(self.order(product_id, city='Unknown city')[0], 422)
        finally:
            for city in ['Giza', 'Alexandria']:
                self.request('save_shipping.php', {'city': city, 'fee': 50})

    def test_shipping_validation(self):
        for fee in [-1, 1000001, '50', None, True, [], {}]:
            self.assertEqual(self.request('save_shipping.php', {'city': 'Cairo', 'fee': fee})[0], 422)
        for city in ['', 'Unknown city', None, [], 1]:
            self.assertEqual(self.request('save_shipping.php', {'city': city, 'fee': 50})[0], 422)
        self.assertEqual(self.request('save_shipping.php')[0], 405)
        self.assertEqual(self.request('get_shipping.php', {})[0], 405)

    def test_shipping_city_list_matches_checkout(self):
        import re
        entries = re.findall(r"\{ en: '([^']+)', ar: '([^']+)' \}", (ROOT / 'assets/js/egypt-cities.js').read_text())
        cities = json.loads((ROOT / 'api/shipping-cities.json').read_text())
        self.assertEqual(cities, [dict(en=en, ar=ar) for en, ar in entries])

    def test_create_edit_archive_restore_and_order_history(self):
        product_id, product = self.product()
        code, order = self.order(product_id)
        self.assertEqual(code, 200, order)
        product.update(id=product_id, name_en='Renamed tea', price=50)
        self.assertEqual(self.request('save_product.php', product)[0], 200)
        self.assertEqual(self.request('archive_product.php', {'id': product_id, 'archived': True})[0], 200)
        _, public = self.request('get_products.php', anonymous=True)
        self.assertNotIn(product_id, [p['id'] for p in public['products']])
        self.assertEqual(self.order(product_id, 50)[0], 409)
        # Editing an archived product must not accidentally restore it.
        self.assertEqual(self.request('save_product.php', product)[0], 200)
        _, admin = self.request('get_products.php?admin=1')
        self.assertTrue(next(p for p in admin['products'] if p['id'] == product_id)['archived'])
        _, old = self.request('get_order.php?id=' + str(order['order_id']))
        self.assertEqual(old['order']['items'][0]['name'], 'Test tea <b>literal</b>')
        self.assertEqual(old['order']['total_amount'], 115)
        self.assertEqual(self.request('archive_product.php', {'id': product_id, 'archived': False})[0], 200)
        _, public = self.request('get_products.php', anonymous=True)
        self.assertEqual(next(p for p in public['products'] if p['id'] == product_id)['price'], 50)
        self.assertEqual(self.order(product_id, 50)[0], 200)

    def test_checkout_uses_catalog_and_rejects_stale_price(self):
        product_id, _ = self.product()
        self.assertEqual(self.order(product_id, .01)[0], 409)
        self.assertEqual(self.order(999999)[0], 409)
        code, order = self.order(product_id, language='ar')
        self.assertEqual(code, 200)
        _, data = self.request('get_order.php?id=' + str(order['order_id']))
        self.assertEqual(data['order']['items'][0]['name'], 'شاي تجريبي')
        self.assertEqual(data['order']['total_amount'], 115)
        for qty in [0, -1, 1.2, '2', 1000]:
            self.assertEqual(self.order(product_id, items=[dict(id=product_id, qty=qty, price=32.5)])[0], 422)

    def test_bulk_status_is_atomic_and_updates_stats(self):
        product_id, _ = self.product()
        ids = [self.order(product_id)[1]['order_id'] for _ in range(2)]
        code, data = self.request('update_order_status.php', {'ids': ids + [ids[0]], 'status': 'shipped'})
        self.assertEqual(code, 200)
        self.assertEqual(data['updated_count'], 2)
        for order_id in ids:
            self.assertEqual(self.request('get_order.php?id=' + str(order_id))[1]['order']['status'], 'shipped')
        self.assertEqual(self.request('update_order_status.php', {'ids': ids + [999999], 'status': 'returned'})[0], 404)
        for order_id in ids:
            self.assertEqual(self.request('get_order.php?id=' + str(order_id))[1]['order']['status'], 'shipped')
        _, data = self.request('get_orders.php?status=shipped')
        self.assertTrue(all(o['status'] == 'shipped' for o in data['orders']))
        self.assertGreaterEqual(data['stats']['shipped'], 2)
        self.assertEqual(self.request('update_order_status.php', {'id': ids[0], 'status': 'delivered'})[0], 200)

    def test_bulk_rejects_invalid_payloads(self):
        for ids in [[], ['1'], [True], [0], [-1], [1.5], '1']:
            self.assertEqual(self.request('update_order_status.php', {'ids': ids, 'status': 'shipped'})[0], 422)
        self.assertEqual(self.request('update_order_status.php', {'ids': [1], 'status': 'invalid'})[0], 422)

    def test_product_validation(self):
        _, valid = self.product()
        for changes in [dict(price=-1), dict(price='2'), dict(name_ar=''), dict(category='invalid'),
                        dict(image='javascript:alert(1)'), dict(image='assets/img/../../secret.png'),
                        dict(icon='bi-x" onclick="alert(1)'), dict(images=['data:text/html,test']), dict(images=[''] * 13)]:
            self.assertEqual(self.request('save_product.php', dict(valid, **changes))[0], 422, changes)
        self.assertEqual(self.request('save_product.php', dict(valid, id=999999))[0], 404)
        self.assertEqual(self.request('archive_product.php', {'id': 999999, 'archived': True})[0], 404)

    def test_image_upload(self):
        product = dict(name_en='Photo test', name_ar='اختبار الصورة', category='seeds', price=10)
        image = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=')
        for filename, contents, expected in [('photo.png', image, 200), ('fake.png', b'<?php echo "bad"; ?>', 422)]:
            boundary = 'OrganicTestBoundary'
            body = (f'--{boundary}\r\nContent-Disposition: form-data; name="product"\r\n\r\n{json.dumps(product)}\r\n'
                    f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="{filename}"\r\nContent-Type: image/png\r\n\r\n').encode() + contents + f'\r\n--{boundary}--\r\n'.encode()
            req = urllib.request.Request(self.url + '/api/save_product.php', data=body, headers={'Content-Type': 'multipart/form-data; boundary=' + boundary})
            try:
                with self.client.open(req) as response:
                    self.assertEqual(response.status, expected)
                    product_id = json.load(response)['product_id']
                    _, data = self.request('get_products.php?admin=1')
                    saved = next(p for p in data['products'] if p['id'] == product_id)
                    self.assertTrue(saved['image'].startswith('assets/img/uploads/'))
                    self.assertTrue((self.root / saved['image']).is_file())
            except urllib.error.HTTPError as error:
                self.assertEqual(error.code, expected)


if __name__ == '__main__':
    unittest.main()

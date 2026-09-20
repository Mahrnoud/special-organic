/* State-level regression tests; no browser dependencies and no real localStorage. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
function context(initialCart = []) {
  const storage = new Map([['os_cart', JSON.stringify(initialCart)]]);
  const notices = [];
  const c = vm.createContext({
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    document: { addEventListener() {}, querySelectorAll: () => [], createElement: () => ({setAttribute(){}}), querySelector: () => ({prepend: n => notices.push(n.textContent)}) },
    osT: k => k, osCatalogLoaded: true,
    OS_PRODUCTS: [{id:1, variants:[{size_id:10,price:25},{size_id:20,price:70}]}, {id:2, variants:[{size_id:10,price:15}]}],
  });
  vm.runInContext(read('assets/js/cart.js'), c);
  return {c, storage, notices, run: code => vm.runInContext(code,c)};
}
test('two sizes have independent quantities, totals, and removal', () => {
  const {run} = context();
  assert.equal(run('osAddToCart(1, 2, 10)'), true);
  assert.equal(run('osAddToCart(1, 1, 20)'), true);
  assert.equal(run('osCartTotal()'), 120);
  run('osUpdateCartQty(1, 3, 20)');
  assert.equal(run('osGetCart().find(l => l.size_id === 10).qty'), 2);
  assert.equal(run('osCartTotal()'), 260);
  run('osRemoveFromCart(1, 10)');
  assert.equal(run('osCartCount()'), 3);
  assert.equal(run('osCartTotal()'), 210);
});
test('quick add requires a size when there are multiple choices', () => {
  const {run} = context();
  assert.equal(run('osAddToCart(1, 1)'), false);
  assert.equal(run('osAddToCart(1, 1, 999)'), false);
  assert.equal(run('osAddToCart(2, 1)'), true);
  assert.equal(run('osGetCart()[0].size_id'), 10);
});
test('old carts only migrate unambiguous sizes and explain removed entries', () => {
  const {run,notices} = context([{id:1,qty:2},{id:2,qty:3},{id:999,qty:1}]);
  run('osReconcileCart()');
  assert.equal(run('osGetCart().length'), 1);
  assert.equal(run('osGetCart()[0].size_id'), 10);
  assert.equal(run('osCartTotal()'), 45);
  assert.deepEqual(notices, ['cart_size_removed']);
});
test('removed variants do not silently become another size', () => {
  const {run,notices} = context([{id:1,size_id:99,qty:1},{id:1,size_id:10,qty:2}]);
  run('osReconcileCart()');
  assert.equal(run('osGetCart().length'), 1);
  assert.equal(run('osCartCount()'), 2);
  assert.equal(notices.length, 1);
});
test('Arabic is the default and saved English consistently uses LTR', () => {
  for (const saved of [null,'invalid','ar','en']) {
    const attrs = {}; let css = '';
    const c = vm.createContext({localStorage:{getItem:()=>saved},window:{},document:{
      documentElement:{setAttribute:(k,v)=>attrs[k]=v},write:v=>css=v,addEventListener(){}
    }});
    vm.runInContext(read('assets/js/boot.js'),c);
    vm.runInContext(read('assets/js/i18n.js'),c);
    assert.equal(attrs.lang, saved === 'en' ? 'en' : 'ar');
    assert.equal(attrs.dir, saved === 'en' ? 'ltr' : 'rtl');
    assert.equal(vm.runInContext('osLang()',c),attrs.lang);
    assert.equal(css.includes('bootstrap.rtl'), saved !== 'en');
  }
});
test('Excel rows retain purchased size snapshots and the selected deleted view', () => {
  let rows, filename;
  const source = read('assets/js/admin.js');
  const start = source.indexOf('function exportOrdersToExcel()');
  const end = source.indexOf("\ndocument.getElementById('orderView')",start);
  const c = vm.createContext({
    osLastOrders:[{id:7,full_name:'Test',city:'Cairo',country:'Egypt',items:[{name:'Tea & seeds',size_en:'250g pack',qty:2}],total_amount:125,shipping_fee:25,status:'completed',created_at:'2026-09-20 10:00:00',deleted_at:'2026-09-20 11:00:00'}],
    osT:k=>k, orderItemSize:item=>item.size_en, formatDate:value=>value,
    document:{getElementById:()=>({value:'1'})},
    XLSX:{utils:{aoa_to_sheet:data=>{rows=data;return {};},book_new:()=>({}),book_append_sheet(){}},writeFile:(_book,name)=>{filename=name;}},
  });
  vm.runInContext(source.slice(start,end),c);
  vm.runInContext('exportOrdersToExcel()',c);
  assert.equal(rows.length,2);
  assert.equal(rows[1][7],'Tea & seeds — 250g pack × 2');
  assert.equal(rows[1][8],100);
  assert.equal(rows[1][11],'status_completed');
  assert.equal(rows[1][13],'2026-09-20 11:00:00');
  assert.match(filename,/deleted-orders/);
});

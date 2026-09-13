import 'dotenv/config';

const HOST = process.env.API_URL || 'http://localhost:3001';
const TOKEN = process.env.TEST_CUSTOMER_TOKEN;
if (!TOKEN) throw new Error('Set TEST_CUSTOMER_TOKEN to a MongoDB-backed customer JWT before running this test.');

const order = {
  items: [
    { id: 'p1', name: 'Turmeric Powder', price: 120, quantity: 2, category: 'Spices', tax_type: '5%', image: '' },
    { id: 'p2', name: 'Garam Masala', price: 250, quantity: 1, category: 'Blends', tax_type: '5%', image: '' },
  ],
  subtotal: 466.67,
  shipping_cost: 50,
  tax_amount: 23.33,
  total_amount: 540,
  customer_name: 'Hook Test',
  customer_email: 'hooktest@example.com',
  customer_phone: '9999900000',
  shipping_method: 'standard',
  coupon_code: null,
  coupon_discount: 0,
  billing_details: {},
  shipping_address: { name: 'Hook Test', phone: '9999900000', email: 'hooktest@example.com', address: '1 Test St, Testville, TS, 000000' },
};

let created;
try {
  const response = await fetch(`${HOST}/orders`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
  if (!response.ok) throw Object.assign(new Error(await response.text()), { status: response.status });
  created = await response.json();
  console.log('CREATE_OK id=' + created.id + ' orderNumber=' + created.orderNumber);
  const items = created.items;
  console.log('ITEMS_TYPE=' + (Array.isArray(items) ? 'array' : typeof items));
  console.log('ITEMS_COUNT=' + (Array.isArray(items) ? items.length : 'n/a'));
  if (Array.isArray(items)) {
    items.forEach((it, i) => console.log(`  item[${i}] name=${it && it.name} qty=${it && it.quantity} price=${it && it.price}`));
  }
} catch (e) {
  console.log('CREATE_FAIL message=' + (e?.message));
  console.log('CREATE_FAIL status=' + (e?.status));
  try { console.log('CREATE_FAIL data=' + JSON.stringify(e?.response || e?.data)); } catch (_) {}
  process.exit(3);
}

console.log('Cleanup is intentionally manual: delete the test order from MongoDB after confirming it.');

import assert from 'node:assert/strict';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

process.env.MONGOMS_DOWNLOAD_DIR = path.resolve('.mongodb-binaries');
const mongo = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = 'sgrd_masale_test';
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough';
process.env.CORS_ORIGIN = 'http://localhost:3000';

const { default: app } = await import('../src/main.js');
const { getDb, closeMongo } = await import('../src/utils/mongoClient.js');
const { getModel } = await import('../src/models/index.js');
await getDb();
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const call = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  return { status: response.status, body: await response.json().catch(() => null) };
};

try {
  assert.equal((await call('/health')).status, 200);
  const signup = await call('/db/collections/users', { method: 'POST', body: JSON.stringify({ name: 'Test Customer', email: 'customer@example.test', password: 'SafePassword123!' }) });
  assert.equal(signup.status, 201); assert.ok(signup.body.token);
  const duplicate = await call('/db/collections/users', { method: 'POST', body: JSON.stringify({ name: 'Test Customer', email: 'customer@example.test', password: 'SafePassword123!' }) });
  assert.equal(duplicate.status, 409);
  assert.equal((await call('/db/auth/users', { method: 'POST', body: JSON.stringify({ identity: 'customer@example.test', password: 'wrong' }) })).status, 400);
  const login = await call('/db/auth/users', { method: 'POST', body: JSON.stringify({ identity: 'customer@example.test', password: 'SafePassword123!' }) });
  assert.equal(login.status, 200);
  const address = await call('/db/collections/addresses', { method: 'POST', headers: { authorization: `Bearer ${login.body.token}` }, body: JSON.stringify({ name: 'Test Customer', address: 'Test address' }) });
  assert.equal(address.status, 201);
  assert.equal((await call('/db/collections/addresses')).status, 401);
  await getModel('admin').create({ id: 'admin-test-0001', collectionName: 'admin', email: 'admin@example.test', passwordHash: await bcrypt.hash('AdminPassword123!', 12), name: 'Admin' });
  const adminLogin = await call('/db/auth/admin', { method: 'POST', body: JSON.stringify({ identity: 'admin@example.test', password: 'AdminPassword123!' }) });
  assert.equal(adminLogin.status, 200);
  const unauthorizedProduct = await call('/db/collections/products', { method: 'POST', headers: { authorization: `Bearer ${login.body.token}` }, body: JSON.stringify({ name: 'Blocked Product', price: 10, category: 'Test', stock_quantity: 1 }) });
  assert.equal(unauthorizedProduct.status, 403);
  const product = await call('/db/collections/products', { method: 'POST', headers: { authorization: `Bearer ${adminLogin.body.token}` }, body: JSON.stringify({ name: 'Test Turmeric', price: 100, category: 'Spices', stock_quantity: 12, sku: 'TEST-TURMERIC' }) });
  assert.equal(product.status, 201);
  const publicProducts = await call('/db/collections/products?filter=category%20%3D%20%22Spices%22&sort=name');
  assert.equal(publicProducts.status, 200); assert.equal(publicProducts.body.totalItems, 1);
  const catalogProducts = await call('/db/collections/products?filter=(isDeleted%20%3D%20false%20%7C%7C%20isDeleted%20%3D%20null)%20%26%26%20status%20%3D%20true&sort=-created');
  assert.equal(catalogProducts.status, 200); assert.equal(catalogProducts.body.totalItems, 1);
  assert.equal((await call('/orders', { method: 'POST', body: JSON.stringify({}) })).status, 401);
  const invalidOrder = await call('/orders', { method: 'POST', headers: { authorization: `Bearer ${login.body.token}` }, body: JSON.stringify({ items: [], total_amount: 0 }) });
  assert.equal(invalidOrder.status, 400);
  const order = await call('/orders', { method: 'POST', headers: { authorization: `Bearer ${login.body.token}` }, body: JSON.stringify({ items: [{ productId: product.body.id, name: 'Test Turmeric', price: 100, quantity: 1 }], customer_name: 'Test Customer', customer_email: 'customer@example.test', customer_phone: '9999999999', subtotal: 100, tax_amount: 0, shipping_cost: 0, total_amount: 100, shipping_address: { name: 'Test Customer', phone: '9999999999', email: 'customer@example.test', address: 'Test address' } }) });
  assert.equal(order.status, 201); assert.ok(order.body.orderNumber);
  const customerOrders = await call('/db/collections/orders', { headers: { authorization: `Bearer ${login.body.token}` } });
  assert.equal(customerOrders.status, 200); assert.equal(customerOrders.body.totalItems, 1);
  const statusUpdate = await call(`/orders/${order.body.id}`, { method: 'PUT', headers: { authorization: `Bearer ${adminLogin.body.token}` }, body: JSON.stringify({ order_status: 'processing' }) });
  assert.equal(statusUpdate.status, 200); assert.equal(statusUpdate.body.order_status, 'processing');
  await closeMongo(); await getDb();
  const persistedLogin = await call('/db/auth/users', { method: 'POST', body: JSON.stringify({ identity: 'customer@example.test', password: 'SafePassword123!' }) });
  assert.equal(persistedLogin.status, 200);
  const persistedOrders = await call('/db/collections/orders', { headers: { authorization: `Bearer ${persistedLogin.body.token}` } });
  assert.equal(persistedOrders.body.items[0].order_status, 'processing');
  console.log('Mongoose API smoke test passed');
} finally {
  await new Promise((resolve) => server.close(resolve));
  await closeMongo();
  await mongo.stop();
}

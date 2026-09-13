import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(apiDir, '..');
const webDir = path.resolve(projectDir, '../web');
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(projectDir, '.mongodb-binaries');
const mongo = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = 'sgrd_browser_test';
process.env.JWT_SECRET = 'browser-test-only-secret';
const apiPort = Number(process.env.BROWSER_API_PORT || 3101);
const webPort = Number(process.env.BROWSER_WEB_PORT || 3100);
process.env.CORS_ORIGIN = `http://127.0.0.1:${webPort}`;
process.env.PORT = String(apiPort);

const { default: app } = await import('../src/main.js');
const { getDb, closeMongo } = await import('../src/utils/mongoClient.js');
const { getModel } = await import('../src/models/index.js');
await getDb();
await getModel('categories').create({ id: 'browser-category', collectionName: 'categories', name: 'Spices', status: true });
await getModel('products').create({ id: 'browser-product', collectionName: 'products', name: 'Browser Test Turmeric', description: 'A test product used only for local browser validation.', price: 125, category: 'Spices', stock_quantity: 10, status: true });
const api = app.listen(apiPort);
const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(webPort)], { cwd: webDir, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, API_URL: `http://127.0.0.1:${apiPort}` } });

const shutdown = async () => {
  vite.kill();
  await new Promise((resolve) => api.close(resolve));
  await closeMongo();
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => vite.kill());
console.log(`Browser test app ready at http://127.0.0.1:${webPort}`);

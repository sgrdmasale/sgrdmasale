import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import Database from 'better-sqlite3';
import { MongoMemoryServer } from 'mongodb-memory-server';

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(apiDir, '../pocketbase/pb_data/data.db');
process.env.MONGOMS_DOWNLOAD_DIR = path.resolve(apiDir, '.mongodb-binaries');
const mongo = await MongoMemoryServer.create();
const sqlite = new Database(source, { readonly: true });
const expectedProducts = sqlite.prepare('select count(*) as count from products').get().count;
const expectedUsers = sqlite.prepare('select count(*) as count from users').get().count;
sqlite.close();

const child = spawn(process.execPath, ['scripts/migrate-pocketbase-to-mongo.js'], {
  cwd: apiDir,
  env: { ...process.env, MONGODB_URI: mongo.getUri(), MONGODB_DB: 'migration_test', POCKETBASE_DB_PATH: source },
  stdio: 'inherit',
});
const exitCode = await new Promise((resolve) => child.on('exit', resolve));
assert.equal(exitCode, 0, 'migration script must complete successfully');

process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = 'migration_test';
const { getDb, closeMongo } = await import('../src/utils/mongoClient.js');
const { getModel } = await import('../src/models/index.js');
await getDb();
assert.equal(await getModel('products').countDocuments(), expectedProducts);
assert.equal(await getModel('users').countDocuments(), expectedUsers);
await closeMongo();
await mongo.stop();
console.log('PocketBase-to-Mongo migration smoke test passed');

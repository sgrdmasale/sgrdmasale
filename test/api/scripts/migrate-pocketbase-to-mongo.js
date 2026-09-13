/*
 * One-time migration. It preserves PocketBase record ids, timestamps and
 * password hashes so existing links and logins continue to work.
 *
 * Usage: MONGODB_URI="..." node scripts/migrate-pocketbase-to-mongo.js
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { copyFile, mkdir, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { getDb, closeMongo } from '../src/utils/mongoClient.js';
import { getModel, validCollection } from '../src/models/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = process.env.POCKETBASE_DB_PATH || path.resolve(here, '../../pocketbase/pb_data/data.db');
const oldStorage = path.resolve(path.dirname(source), 'storage');
const newStorage = path.resolve(here, '../uploads');
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

const sqlite = new Database(source, { readonly: true });
await getDb();
const collections = sqlite.prepare('SELECT id, name, type FROM _collections').all();

for (const definition of collections) {
  // PocketBase stores each collection in a SQLite table named after its
  // collection name (the `_collections.id` value is metadata, not the table).
  const tableExists = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(definition.name);
  if (!tableExists) continue;
  const rows = sqlite.prepare(`SELECT * FROM "${definition.name.replace(/"/g, '""')}"`).all();
  if (!rows.length) continue;
  const documents = rows.map((row) => {
    const document = { ...row, collectionName: definition.name };
    if (document.password) { document.passwordHash = document.password; delete document.password; }
    // SQLite JSON columns are stored as text; convert valid objects/arrays.
    for (const [key, value] of Object.entries(document)) {
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try { document[key] = JSON.parse(value); } catch { /* leave normal text alone */ }
      }
    }
    return document;
  });
  if (!validCollection(definition.name)) { console.log(`${definition.name}: skipped (not used by application)`); continue; }
  await getModel(definition.name).bulkWrite(documents.map((document) => ({ replaceOne: { filter: { id: document.id }, replacement: document, upsert: true } })), { ordered: false });
  console.log(`${definition.name}: migrated ${documents.length} records`);
}

await closeMongo();
sqlite.close();
// PocketBase names stored files uniquely per record. The web client stores only
// the filename, so retain that filename in the API's static upload directory.
// Existing attachments are copied alongside the database import.
await mkdir(newStorage, { recursive: true });
try {
  const copyAttachments = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const sourcePath = path.join(directory, entry.name);
      if (entry.isDirectory()) await copyAttachments(sourcePath);
      else if (entry.isFile()) await copyFile(sourcePath, path.join(newStorage, entry.name));
    }
  };
  await copyAttachments(oldStorage);
  console.log('Existing PocketBase attachments copied to api/uploads.');
} catch (error) {
  console.warn(`Attachments were not copied (${error.message}). The MongoDB data import still completed.`);
}
console.log('PocketBase data migration complete. Verify MongoDB, then switch the application environment.');

import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getDb, closeMongo } from '../src/utils/mongoClient.js';

const apply = process.argv.includes('--apply');
const uploadsDir = path.resolve('uploads');
const variantWidths = [100, 500, 800];

function replaceFilenames(value, replacements) {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map((entry) => replaceFilenames(entry, replacements));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replaceFilenames(entry, replacements)]));
  }
  return value;
}

const files = (await readdir(uploadsDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && !entry.name.includes('.'))
  .map((entry) => entry.name);

if (!files.length) {
  console.log('No legacy extensionless uploads found.');
  process.exit(0);
}

console.log(`${apply ? 'Migrating' : 'Would migrate'} ${files.length} legacy image(s).`);
if (!apply) {
  console.log('Run with --apply after backing up uploads and MongoDB.');
  process.exit(0);
}

const replacements = new Map(files.map((name) => [name, `${name}.webp`]));
for (const name of files) {
  const source = path.join(uploadsDir, name);
  const target = `${source}.webp`;
  const image = sharp(source, { animated: false }).rotate();
  await image.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(target);
  await Promise.all(variantWidths.map((width) => image.clone()
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: width === 100 ? 72 : 80 })
    .toFile(target.replace(/\.webp$/, `.w${width}.webp`))));
}

const connection = await getDb();
for (const { name } of await connection.db.listCollections().toArray()) {
  const collection = connection.db.collection(name);
  for await (const document of collection.find({})) {
    const updated = replaceFilenames(document, replacements);
    if (JSON.stringify(updated) !== JSON.stringify(document)) await collection.replaceOne({ _id: document._id }, updated);
  }
}

for (const name of files) await unlink(path.join(uploadsDir, name));
await closeMongo();
console.log('Migration complete. Legacy originals were replaced by WebP files and responsive variants.');

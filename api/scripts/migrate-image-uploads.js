import { access, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getDb, closeMongo } from '../src/utils/mongoClient.js';

const apply = process.argv.includes('--apply');
const uploadsDir = path.resolve('uploads');
const variantWidths = [100, 500, 800];

function replaceFilenames(value, replacements) {
  if (typeof value === 'string') {
    const replacement = replacements.get(value);
    return { value: replacement || value, changed: Boolean(replacement) };
  }
  if (Array.isArray(value)) {
    const entries = value.map((entry) => replaceFilenames(entry, replacements));
    return { value: entries.map((entry) => entry.value), changed: entries.some((entry) => entry.changed) };
  }

  // MongoDB BSON values (especially ObjectId) are not plain objects. Recursing
  // into them corrupts their internal fields, including the immutable `_id`.
  const isPlainObject = value && typeof value === 'object'
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!isPlainObject) return { value, changed: false };

  const entries = Object.entries(value).map(([key, entry]) => [key, replaceFilenames(entry, replacements)]);
  return {
    value: Object.fromEntries(entries.map(([key, entry]) => [key, entry.value])),
    changed: entries.some(([, entry]) => entry.changed),
  };
}

async function writeIfMissing(outputPath, operation) {
  try {
    await access(outputPath);
  } catch {
    await operation();
  }
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
  await writeIfMissing(target, () => image.clone()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target));
  await Promise.all(variantWidths.map((width) => image.clone()
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: width === 100 ? 72 : 80 }))
    .map(async (operation, index) => {
      const width = variantWidths[index];
      const output = target.replace(/\.webp$/, `.w${width}.webp`);
      await writeIfMissing(output, () => operation.toFile(output));
    }));
}

const connection = await getDb();
for (const { name } of await connection.db.listCollections().toArray()) {
  const collection = connection.db.collection(name);
  for await (const document of collection.find({})) {
    const updated = replaceFilenames(document, replacements);
    if (!updated.changed) continue;

    // `$set` omits `_id` entirely; replaceOne would validate it even when its
    // BSON representation is unchanged.
    const { _id, ...fields } = updated.value;
    await collection.updateOne({ _id: document._id }, { $set: fields });
  }
}

for (const name of files) await unlink(path.join(uploadsDir, name));
await closeMongo();
console.log('Migration complete. Legacy originals were replaced by WebP files and responsive variants.');

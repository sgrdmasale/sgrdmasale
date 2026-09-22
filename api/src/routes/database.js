import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { unlink } from 'fs/promises';
import { getDb } from '../utils/mongoClient.js';
import { getModel, validCollection } from '../models/index.js';
import { publicRecord, recordId, timestamps } from '../utils/records.js';
import { pocketBaseFilter, sortFromPocketBase } from '../utils/pbFilter.js';
import { issueToken, optionalAuth, requireRole } from '../middleware/mongo-auth.js';

const router = express.Router();
const upload = multer({ dest: path.resolve('uploads'), limits: { fileSize: 8 * 1024 * 1024 } });
async function convertToWebp(filePath) {
  const webpPath = filePath.replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
  await sharp(filePath).webp().toFile(webpPath);
  await unlink(filePath);
  return path.basename(webpPath);
}

const authCollections = new Set(['users', 'admin']);
const adminOnly = new Set(['admin_settings', 'banners', 'categories', 'coupons', 'offers', 'products', 'shipping_rates', 'shipping_channels', 'payment_gateways', 'taxes', 'company_settings', 'email_templates', 'bulk_coupon_uploads', 'user_limits']);
const publicCollections = new Set(['products', 'categories', 'banners', 'offers', 'shipping_rates', 'shipping_channels', 'taxes', 'company_settings', 'policies']);
function modelFor(collection, res) { if (!validCollection(collection)) { res.status(404).json({ error: 'Unknown collection' }); return null; } return getModel(collection); }

function canWrite(collection, auth, record) {
  if (auth?.collectionName === 'admin') return true;
  if (adminOnly.has(collection)) return false;
  if (!auth) return ['contact_submissions', 'partnership_inquiries', 'users'].includes(collection);
  if (collection === 'users' || collection === 'addresses' || collection === 'orders') return !record || record.userId === auth.id || record.id === auth.id;
  return false;
}

function canRead(collection, auth, record) {
  if (publicCollections.has(collection) || auth?.collectionName === 'admin') return true;
  if (!auth) return false;
  if (collection === 'users') return record ? record.id === auth.id : false;
  if (collection === 'addresses' || collection === 'orders') return record ? record.userId === auth.id : true;
  return false;
}

async function uploadedFields(req) {
  const body = { ...req.body };
  if (req.files) {
    for (const file of req.files) {
      let filename = file.filename;
      // Check if it's an image by mimetype
      if (file.mimetype && file.mimetype.startsWith('image/')) {
        try {
          filename = await convertToWebp(path.resolve('uploads', file.filename));
        } catch (err) {
          console.error(`Failed to convert ${file.filename} to WebP:`, err);
          // If conversion fails, we keep the original file
          filename = file.filename;
        }
      }
      // Now update the body as before
      const list = body[file.fieldname] ? (Array.isArray(body[file.fieldname]) ? body[file.fieldname] : [body[file.fieldname]]) : [];
      list.push(filename);
      body[file.fieldname] = file.fieldname === 'photos' || file.fieldname === 'images' ? list : filename;
    }
  }
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try { body[key] = JSON.parse(value); } catch { /* preserve normal strings */ }
    }
  }
  return body;
}

router.post('/auth/:collection', async (req, res) => {
  const { collection } = req.params;
  if (!authCollections.has(collection)) return res.status(404).json({ error: 'Unknown auth collection' });
  await getDb();
  const record = await getModel(collection).findOne({ email: String(req.body.identity || req.body.email || '').toLowerCase() }).select('+passwordHash').lean();
  if (!record || !await bcrypt.compare(req.body.password || '', record.passwordHash || record.password || '')) return res.status(400).json({ message: 'Invalid email or password' });
  const publicUser = publicRecord(record);
  res.json({ token: issueToken(publicUser), record: publicUser });
});

router.post('/collections/:collection', optionalAuth, upload.any(), async (req, res) => {
  const { collection } = req.params;
  const Model = modelFor(collection, res); if (!Model) return;
  if (!canWrite(collection, req.auth)) return res.status(403).json({ error: 'You are not authorized to create this record' });
  const data = await uploadedFields(req);
  if (authCollections.has(collection)) {
    if (!data.password) return res.status(400).json({ error: 'A password is required' });
    data.passwordHash = await bcrypt.hash(data.password, 12);
    delete data.password; delete data.passwordConfirm;
    data.email = String(data.email).toLowerCase(); data.collectionName = collection;
  }
  if (req.auth && ['addresses', 'orders'].includes(collection)) data.userId = req.auth.id;
  const document = timestamps({ ...data, id: data.id || recordId(), collectionName: data.collectionName || collection });
  try { await getDb(); await Model.create(document); } catch (error) { if (error.code === 11000) return res.status(409).json({ error: 'A record with that value already exists' }); throw error; }
  const output = publicRecord(document);
  res.status(201).json(authCollections.has(collection) ? { token: issueToken(output), record: output } : output);
});

router.get('/collections/:collection', optionalAuth, async (req, res) => {
  const { collection } = req.params; const page = Math.max(1, Number(req.query.page) || 1); const perPage = Math.min(500, Number(req.query.perPage) || 30);
  const Model = modelFor(collection, res); if (!Model) return;
  const filter = pocketBaseFilter(req.query.filter);
  if (!canRead(collection, req.auth)) return res.status(req.auth ? 403 : 401).json({ error: 'You are not authorized to view this collection' });
  if (req.auth?.collectionName !== 'admin' && ['addresses', 'orders'].includes(collection)) filter.userId = req.auth.id;
  await getDb(); const totalItems = await Model.countDocuments(filter); const items = await Model.find(filter).sort(sortFromPocketBase(req.query.sort)).skip((page - 1) * perPage).limit(perPage).lean();
  res.json({ page, perPage, totalPages: Math.ceil(totalItems / perPage), totalItems, items: items.map(publicRecord) });
});

router.get('/collections/:collection/:id', optionalAuth, async (req, res) => {
  const Model = modelFor(req.params.collection, res); if (!Model) return; await getDb(); const record = await Model.findOne({ id: req.params.id }).lean();
  if (!record) return res.status(404).json({ error: 'Record not found' });
  if (!canRead(req.params.collection, req.auth, record)) return res.status(403).json({ error: 'You are not authorized to view this record' });
  res.json(publicRecord(record));
});

router.patch('/collections/:collection/:id', optionalAuth, upload.any(), async (req, res) => {
  const Model = modelFor(req.params.collection, res); if (!Model) return; await getDb(); const existing = await Model.findOne({ id: req.params.id }).lean();
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  if (!canWrite(req.params.collection, req.auth, existing)) return res.status(403).json({ error: 'You are not authorized to update this record' });
  const changes = await uploadedFields(req); delete changes.id; delete changes.created; delete changes.collectionName;
  if (changes.password) { changes.passwordHash = await bcrypt.hash(changes.password, 12); delete changes.password; delete changes.passwordConfirm; }
  const updated = await Model.findOneAndUpdate({ id: req.params.id }, { $set: changes }, { returnDocument: 'after', runValidators: true }).lean(); res.json(publicRecord(updated));
});

router.delete('/collections/:collection/:id', optionalAuth, async (req, res) => {
  const Model = modelFor(req.params.collection, res); if (!Model) return; await getDb(); const existing = await Model.findOne({ id: req.params.id }).lean();
  if (!existing) return res.status(404).json({ error: 'Record not found' });
  if (!canWrite(req.params.collection, req.auth, existing)) return res.status(403).json({ error: 'You are not authorized to delete this record' });
  await Model.deleteOne({ id: req.params.id }); res.status(204).end();
});

router.post('/admin/bootstrap', requireRole('admin'), (_req, res) => res.status(204).end());
export default router;

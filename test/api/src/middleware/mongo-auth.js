import jwt from 'jsonwebtoken';
import { getDb } from '../utils/mongoClient.js';
import { getModel } from '../models/index.js';
import { publicRecord } from '../utils/records.js';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is required. Add a long random value to api/.env.');

export function issueToken(record) {
  return jwt.sign({ sub: record.id, collection: record.collectionName }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

export async function optionalAuth(req, _res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return next();
  try {
    const payload = jwt.verify(token, secret);
    await getDb();
    const record = await getModel(payload.collection)?.findOne({ id: payload.sub }).lean();
    if (record) req.auth = publicRecord(record);
  } catch { /* invalid tokens are handled by routes that require authentication */ }
  next();
}

export function requireRole(...collections) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Authentication is required' });
    if (!collections.includes(req.auth.collectionName)) return res.status(403).json({ error: 'You are not authorized to perform this action' });
    next();
  };
}

import crypto from 'crypto';

export const recordId = () => crypto.randomBytes(8).toString('hex').slice(0, 15);

export function timestamps(document = {}) {
  const now = new Date().toISOString();
  return { ...document, id: document.id || recordId(), created: document.created || now, updated: now };
}

export function publicRecord(record) {
  if (!record) return record;
  const { _id, password, passwordHash, ...publicDocument } = record;
  return publicDocument;
}

import { getDb } from './mongoClient.js';
import { getModel } from '../models/index.js';
import { publicRecord, timestamps } from './records.js';
import { pocketBaseFilter, sortFromPocketBase } from './pbFilter.js';

function notFound() { const error = new Error('Record not found'); error.status = 404; return error; }

function collection(name) {
  return {
    async getOne(id) { await getDb(); const value = await getModel(name).findOne({ id }).lean(); if (!value) throw notFound(); return publicRecord(value); },
    async create(data) { await getDb(); const document = await getModel(name).create(timestamps({ ...data, collectionName: data.collectionName || name })); return publicRecord(document.toObject()); },
    async update(id, data) { await getDb(); const next = await getModel(name).findOneAndUpdate({ id }, { $set: data }, { returnDocument: 'after', runValidators: true }).lean(); if (!next) throw notFound(); return publicRecord(next); },
    async delete(id) { await getDb(); const result = await getModel(name).deleteOne({ id }); if (!result.deletedCount) throw notFound(); return true; },
    async getList(page = 1, perPage = 30, options = {}) { await getDb(); const filter = pocketBaseFilter(options.filter); const Model = getModel(name); const totalItems = await Model.countDocuments(filter); const items = await Model.find(filter).sort(sortFromPocketBase(options.sort)).skip((page - 1) * perPage).limit(perPage).lean(); return { page, perPage, totalItems, totalPages: Math.ceil(totalItems / perPage), items: items.map(publicRecord) }; },
    async getFullList(options = {}) { return (await this.getList(1, 500, options)).items; },
    async getFirstListItem(filter, options = {}) { const result = await this.getList(1, 1, { ...options, filter }); if (!result.items[0]) throw notFound(); return result.items[0]; },
  };
}

export default { collection };
export { collection };

import { optionalAuth, requireRole } from './mongo-auth.js';
const required = (...roles) => [optionalAuth, requireRole(...roles)];
export const requireCustomer = required('users');
export const requireAdmin = required('admin');
export function requireCollection(collection) { return required(collection); }

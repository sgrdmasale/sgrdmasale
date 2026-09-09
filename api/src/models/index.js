import mongoose from 'mongoose';

const { Schema } = mongoose;
const common = {
  id: { type: String, required: true, unique: true, index: true },
  collectionName: { type: String, required: true },
};
const file = { type: String, trim: true };

const definitions = {
  users: { email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, passwordHash: { type: String, required: true, select: false }, name: String, role: { type: String, default: 'customer' } },
  admin: { email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, passwordHash: { type: String, required: true, select: false }, name: String, role: { type: String, default: 'admin' } },
  products: { name: { type: String, required: true, trim: true, index: true }, description: String, price: { type: Number, required: true, min: 0 }, category: { type: String, required: true, index: true }, category_id: String, stock_quantity: { type: Number, required: true, min: 0 }, sku: { type: String, sparse: true, index: true }, image: file, photos: [String], images: [String], status: { type: Boolean, default: true }, isDeleted: { type: Boolean, default: false } },
  categories: { name: { type: String, required: true, trim: true, index: true }, description: String, image: file, status: { type: Boolean, default: true } },
  orders: { userId: { type: String, required: true, index: true }, items: { type: [Schema.Types.Mixed], required: true }, orderNumber: { type: String, required: true, unique: true, index: true }, customer_name: { type: String, required: true }, customer_email: { type: String, required: true, lowercase: true, index: true }, customer_phone: { type: String, required: true }, subtotal: Number, tax_amount: Number, shipping_cost: Number, total_amount: { type: Number, required: true, min: 0 }, shipping_address: Schema.Types.Mixed, billing_details: Schema.Types.Mixed, order_status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true }, payment_status: { type: String, default: 'pending', index: true }, shipping_status: { type: String, default: 'pending' } },
  addresses: { userId: { type: String, required: true, index: true }, name: String, phone: String, email: String, address: String, is_default: { type: Boolean, default: false } },
  coupons: { code: { type: String, required: true, unique: true, uppercase: true, trim: true }, active: { type: Boolean, default: true }, current_usage_count: { type: Number, default: 0 } },
  banners: { title: String, image: file, product_id: String, display_order: { type: Number, default: 0, index: true }, active: { type: Boolean, default: true } },
  offers: { product_id: { type: String, required: true, index: true }, active: { type: Boolean, default: true } },
  shipping_rates: { name: String, rate: { type: Number, min: 0 }, active: { type: Boolean, default: true } },
  shipping_channels: { name: { type: String, required: true }, active: { type: Boolean, default: true } },
  taxes: { name: { type: String, required: true }, percentage: { type: Number, min: 0 }, active: { type: Boolean, default: true } },
  contact_submissions: { name: { type: String, required: true }, email: { type: String, required: true, lowercase: true }, message: { type: String, required: true }, status: { type: String, default: 'new' } },
  partnership_inquiries: { name: { type: String, required: true }, email: { type: String, required: true, lowercase: true }, message: String, status: { type: String, default: 'new' } },
  invoices: { invoice_number: { type: String, required: true, unique: true }, order_id: { type: String, required: true, index: true } },
};

const genericCollections = ['admin_settings', 'admins', 'bulk_coupon_uploads', 'company_settings', 'email_templates', 'password_reset_otps', 'payment_gateways', 'payment_settings', 'policies', 'user_limits', 'order_counter'];
for (const name of genericCollections) definitions[name] = {};

const modelCache = new Map();
export function validCollection(name) { return Object.hasOwn(definitions, name); }
export function getModel(name) {
  if (!validCollection(name)) return null;
  if (!modelCache.has(name)) {
    const schema = new Schema({ ...common, ...definitions[name] }, { strict: false, timestamps: { createdAt: 'created', updatedAt: 'updated' }, versionKey: false, collection: name });
    modelCache.set(name, mongoose.models[`Sgrd_${name}`] || mongoose.model(`Sgrd_${name}`, schema));
  }
  return modelCache.get(name);
}

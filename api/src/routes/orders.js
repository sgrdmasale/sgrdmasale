import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { generateOrderId } from '../utils/orderIdGenerator.js';
import { requireAdmin, requireCustomer } from '../middleware/require-auth.js';

const router = express.Router();

function ensureString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue;
  return String(value).trim();
}

function ensureNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

router.post('/', requireCustomer, async (req, res) => {
  logger.info('===== POST /orders CALLED =====');

  const {
    items,
    customer_name,
    customer_email,
    customer_phone,
    subtotal,
    tax_amount,
    shipping_cost,
    total_amount,
    shipping_address,
    billing_details,
    shipping_method,
    coupon_code,
    coupon_discount,
    userId,
  } = req.body;

  logger.info('Validating required fields...');

  if (!Array.isArray(items) || items.length === 0) {
    logger.warn('Invalid items: must be a non-empty array');
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  const validatedCustomerName = ensureString(customer_name);
  if (!validatedCustomerName) {
    logger.warn('Invalid customer_name: required');
    return res.status(400).json({ error: 'customer_name is required' });
  }

  const validatedCustomerEmail = ensureString(customer_email);
  if (!validatedCustomerEmail) {
    logger.warn('Invalid customer_email: required');
    return res.status(400).json({ error: 'customer_email is required' });
  }

  const validatedCustomerPhone = ensureString(customer_phone);
  if (!validatedCustomerPhone) {
    logger.warn('Invalid customer_phone: required');
    return res.status(400).json({ error: 'customer_phone is required' });
  }

  const validatedTotalAmount = ensureNumber(total_amount, 0);
  if (validatedTotalAmount <= 0) {
    logger.warn('Invalid total_amount: must be positive');
    return res.status(400).json({ error: 'total_amount must be a positive number' });
  }

  logger.info('✅ All required fields validated');

  logger.info('Generating order ID...');
  const orderNumber = await generateOrderId();
  logger.info(`✅ Order ID generated: ${orderNumber}`);

  logger.info('Preparing order data for MongoDB...');

  const validatedSubtotal = ensureNumber(subtotal, 0);
  const validatedTaxAmount = ensureNumber(tax_amount, 0);
  const validatedShippingCost = ensureNumber(shipping_cost, 0);
  const validatedCouponDiscount = ensureNumber(coupon_discount, 0);

  let validatedShippingAddress = {
    name: '',
    phone: '',
    email: '',
    address: '',
  };

  if (shipping_address && typeof shipping_address === 'object') {
    validatedShippingAddress.name = ensureString(shipping_address.name);
    validatedShippingAddress.phone = ensureString(shipping_address.phone);
    validatedShippingAddress.email = ensureString(shipping_address.email);
    validatedShippingAddress.address = ensureString(shipping_address.address);
  }

  const orderDataToPersist = {
    items,
    orderNumber,
    customer_name: validatedCustomerName,
    customer_email: validatedCustomerEmail,
    customer_phone: validatedCustomerPhone,
    subtotal: validatedSubtotal,
    tax_amount: validatedTaxAmount,
    shipping_cost: validatedShippingCost,
    total_amount: validatedTotalAmount,
    shipping_address: validatedShippingAddress,
    order_status: 'pending',
    payment_status: 'pending',
    shipping_status: 'pending',
  };

  if (billing_details) {
    orderDataToPersist.billing_details = billing_details;
  }
  if (shipping_method) {
    orderDataToPersist.shipping_method = ensureString(shipping_method, 'standard');
  }
  if (coupon_code) {
    orderDataToPersist.coupon_code = ensureString(coupon_code);
  }
  if (validatedCouponDiscount > 0) {
    orderDataToPersist.coupon_discount = validatedCouponDiscount;
  }
  // Never trust a customer identifier supplied by the browser.
  orderDataToPersist.userId = req.auth.id;

  logger.info('Order data prepared. Creating order in MongoDB...');
  logger.info(`Order details: ${JSON.stringify(orderDataToPersist, null, 2)}`);

  const createdOrder = await pb.collection('orders').create(orderDataToPersist);

  logger.info(`✅ Order created successfully in MongoDB`);
  logger.info(`Order ID: ${createdOrder.id}`);
  logger.info(`Order Number: ${createdOrder.orderNumber}`);
  logger.info('===== END /orders =====\n');

  res.status(201).json({
    id: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    status: createdOrder.order_status,
    total_amount: createdOrder.total_amount,
    created: createdOrder.created,
  });
});

router.put('/:orderId', requireAdmin, async (req, res) => {
  logger.info('===== PUT /orders/:orderId CALLED =====');

  const { orderId } = req.params;
  const { order_status } = req.body;

  if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
    logger.warn('Invalid orderId: must be a non-empty string');
    return res.status(400).json({ error: 'orderId is required and must be a non-empty string' });
  }

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!order_status || typeof order_status !== 'string' || !validStatuses.includes(order_status.toLowerCase())) {
    logger.warn(`Invalid order_status: "${order_status}". Must be one of: ${validStatuses.join(', ')}`);
    return res.status(400).json({ error: `Invalid order status. Must be one of: ${validStatuses.join(', ')}` });
  }

  logger.info(`Fetching order ${orderId} from MongoDB using an admin-authenticated request...`);

  const existingOrder = await pb.collection('orders').getOne(orderId);
  logger.info(`✅ Order found: ${existingOrder.orderNumber}`);
  logger.info(`Current status: ${existingOrder.order_status}`);
  logger.info(`Current payment_status: ${existingOrder.payment_status}`);
  logger.info(`Current shipping_status: ${existingOrder.shipping_status}`);

  logger.info(`Building complete update payload with all existing fields...`);
  const completeRecord = {
    items: existingOrder.items,
    orderNumber: existingOrder.orderNumber,
    customer_name: existingOrder.customer_name,
    customer_email: existingOrder.customer_email,
    customer_phone: existingOrder.customer_phone,
    subtotal: existingOrder.subtotal,
    tax_amount: existingOrder.tax_amount,
    shipping_cost: existingOrder.shipping_cost,
    total_amount: existingOrder.total_amount,
    order_status: order_status.toLowerCase(),
    payment_status: existingOrder.payment_status,
    shipping_status: existingOrder.shipping_status,
    shipping_address: existingOrder.shipping_address,
    shipping_method: existingOrder.shipping_method,
    coupon_code: existingOrder.coupon_code,
    coupon_discount: existingOrder.coupon_discount,
  };

  if (existingOrder.userId) {
    completeRecord.userId = existingOrder.userId;
  }
  if (existingOrder.customer_id) {
    completeRecord.customer_id = existingOrder.customer_id;
  }
  if (existingOrder.billing_details) {
    completeRecord.billing_details = existingOrder.billing_details;
  }

  logger.info(`Complete update payload prepared:`);
  logger.info(`  - items: ${Array.isArray(completeRecord.items) ? completeRecord.items.length + ' items' : 'N/A'}`);
  logger.info(`  - customer_name: ${completeRecord.customer_name}`);
  logger.info(`  - total_amount: ${completeRecord.total_amount}`);
  logger.info(`  - order_status: ${completeRecord.order_status} (updated)`);
  logger.info(`  - payment_status: ${completeRecord.payment_status} (preserved)`);
  logger.info(`  - shipping_status: ${completeRecord.shipping_status} (preserved)`);

  logger.info(`Updating order ${orderId} in MongoDB...`);
  const updatedOrder = await pb.collection('orders').update(orderId, completeRecord);

  logger.info(`✅ Order ${orderId} updated successfully`);
  logger.info(`New order_status: ${updatedOrder.order_status}`);
  logger.info(`Updated timestamp: ${updatedOrder.updated}`);
  logger.info('===== END PUT /orders/:orderId =====\n');

  res.status(200).json({
    id: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    order_status: updatedOrder.order_status,
    payment_status: updatedOrder.payment_status,
    shipping_status: updatedOrder.shipping_status,
    customer_name: updatedOrder.customer_name,
    customer_email: updatedOrder.customer_email,
    total_amount: updatedOrder.total_amount,
    updated: updatedOrder.updated,
  });
});

export default router;

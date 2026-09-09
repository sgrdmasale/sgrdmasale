import 'dotenv/config';
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { generateOrderId } from '../utils/orderIdGenerator.js';
import { requireCustomer } from '../middleware/require-auth.js';
import { respondNotConfigured } from '../utils/integrationConfig.js';

const isTestMode = process.env.RAZORPAY_MODE === 'test';

// Which env vars hold the active key pair. Kept as names (not just values) so a
// "not configured" response can tell the user exactly what to fill in.
const KEY_ID_ENV = isTestMode ? 'RAZORPAY_TEST_KEY_ID' : 'RAZORPAY_KEY_ID';
const KEY_SECRET_ENV = isTestMode ? 'RAZORPAY_TEST_KEY_SECRET' : 'RAZORPAY_KEY_SECRET';

const razorpayKeyId = String(process.env[KEY_ID_ENV] ?? '').trim();
const razorpayKeySecret = String(process.env[KEY_SECRET_ENV] ?? '').trim();
const isConfigured = razorpayKeyId !== '' && razorpayKeySecret !== '';
const shippingCost = Number(process.env.DEFAULT_SHIPPING_COST || 50);

const router = express.Router();

// Built lazily: the Razorpay constructor throws when key_id is missing, which at
// module scope would take the whole API server down on boot. In test mode the
// keys are often blank until the user pastes them in, so a missing key must
// degrade to a clear 503 on the payment routes, not a dead server.
let razorpayClient = null;
function getRazorpay() {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
  }
  return razorpayClient;
}

logger.info(`Razorpay mode: ${isTestMode ? 'TEST' : 'LIVE'}`);
logger.info(
  isConfigured
    ? `Razorpay credentials loaded from ${KEY_ID_ENV} (${razorpayKeyId.slice(0, 12)}…)`
    : `Razorpay NOT configured — set ${KEY_ID_ENV} and ${KEY_SECRET_ENV} in api/.env`
);

function calculateTaxFromPrice(price, taxRateStr) {
  const rate = parseFloat(taxRateStr?.toString().replace('%', '') || 0);
  if (rate <= 0) return 0;
  return price * (rate / (100 + rate));
}

function calculateExtractedTaxFromItems(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const taxRate = item.tax_type || item.tax_percentage || 0;
    return sum + (calculateTaxFromPrice(price, taxRate) * qty);
  }, 0);
}

function calculateSubtotalFromItems(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const inclusiveSum = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
  const tax = calculateExtractedTaxFromItems(items);
  return inclusiveSum - tax;
}

function ensureNumber(value, defaultValue = 0) {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

function ensureString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue;
  return String(value).trim();
}

function validateCartItems(cartItems) {
  if (!Array.isArray(cartItems)) {
    throw new Error('cartItems must be an array');
  }
  if (cartItems.length === 0) {
    throw new Error('cartItems array cannot be empty');
  }
  return cartItems;
}

// Prices, availability and stock must come from the server-side catalogue.
// Cart state is stored in the browser and can be modified by a customer.
async function canonicalizeCartItems(cartItems) {
  validateCartItems(cartItems);
  return Promise.all(cartItems.map(async (item) => {
    const productId = ensureString(item?.id);
    const quantity = Number(item?.quantity);
    if (!productId || !Number.isSafeInteger(quantity) || quantity < 1) {
      throw new Error('Each cart item must have a valid product and quantity');
    }

    const product = await pb.collection('products').getOne(productId);
    if (product.isDeleted || product.status === false) {
      throw new Error(`Product is no longer available: ${product.name || productId}`);
    }
    if (Number.isFinite(Number(product.stock_quantity)) && quantity > Number(product.stock_quantity)) {
      throw new Error(`Only ${product.stock_quantity} unit(s) of ${product.name} are available`);
    }

    return {
      id: product.id,
      name: product.name,
      quantity,
      price: Number(product.price),
      sku: product.sku,
      image: product.image || product.images?.[0] || product.photos?.[0],
      tax_type: product.tax_type || product.tax_percentage || '0%',
      category: product.category,
    };
  }));
}

async function calculateCouponDiscount(code, cartTotal) {
  if (!ensureString(code)) return 0;
  const coupon = await pb.collection('coupons').getFirstListItem(`code = "${ensureString(code).toUpperCase()}"`);
  const today = new Date();
  if (!coupon.is_active || (coupon.expiry_date && new Date(coupon.expiry_date) < today)) throw new Error('This coupon is no longer valid');
  if (coupon.max_usage_limit > 0 && Number(coupon.current_usage_count || 0) >= Number(coupon.max_usage_limit)) throw new Error('This coupon has reached its usage limit');
  if (Number(coupon.minimum_purchase_amount || 0) > cartTotal) throw new Error('This coupon requires a larger order total');
  const discount = coupon.discount_type === 'percentage'
    ? cartTotal * Number(coupon.discount_value || 0) / 100
    : Number(coupon.discount_value || 0);
  return Math.max(0, Math.min(discount, cartTotal));
}

/**
 * Extract item name with fallback logic
 * Tries: name → title → product_name → productName → item_name → nested product.name → "Unknown Item"
 */
function extractItemName(item) {
  if (!item || typeof item !== 'object') return 'Unknown Item';
  
  // Direct properties
  if (item.name && typeof item.name === 'string' && item.name.trim()) return item.name.trim();
  if (item.title && typeof item.title === 'string' && item.title.trim()) return item.title.trim();
  if (item.product_name && typeof item.product_name === 'string' && item.product_name.trim()) return item.product_name.trim();
  if (item.productName && typeof item.productName === 'string' && item.productName.trim()) return item.productName.trim();
  if (item.item_name && typeof item.item_name === 'string' && item.item_name.trim()) return item.item_name.trim();
  
  // Nested product object
  if (item.product && typeof item.product === 'object') {
    if (item.product.name && typeof item.product.name === 'string' && item.product.name.trim()) {
      return item.product.name.trim();
    }
    if (item.product.title && typeof item.product.title === 'string' && item.product.title.trim()) {
      return item.product.title.trim();
    }
  }
  
  return 'Unknown Item';
}

/**
 * Extract item quantity with fallback logic
 * Tries: quantity → qty → count → 1
 */
function extractItemQuantity(item) {
  if (!item || typeof item !== 'object') return 1;
  
  const qty = item.quantity !== undefined ? item.quantity : 
              item.qty !== undefined ? item.qty : 
              item.count !== undefined ? item.count : 1;
  
  const numQty = ensureNumber(qty, 1);
  return numQty > 0 ? numQty : 1;
}

/**
 * Extract item price with fallback logic
 * Tries: price → unit_price → unitPrice → sale_price → nested product.price → 0
 */
function extractItemPrice(item) {
  if (!item || typeof item !== 'object') return 0;
  
  // Direct properties
  if (item.price !== undefined) {
    const price = ensureNumber(item.price, 0);
    if (price >= 0) return price;
  }
  if (item.unit_price !== undefined) {
    const price = ensureNumber(item.unit_price, 0);
    if (price >= 0) return price;
  }
  if (item.unitPrice !== undefined) {
    const price = ensureNumber(item.unitPrice, 0);
    if (price >= 0) return price;
  }
  if (item.sale_price !== undefined) {
    const price = ensureNumber(item.sale_price, 0);
    if (price >= 0) return price;
  }
  
  // Nested product object
  if (item.product && typeof item.product === 'object') {
    if (item.product.price !== undefined) {
      const price = ensureNumber(item.product.price, 0);
      if (price >= 0) return price;
    }
    if (item.product.unit_price !== undefined) {
      const price = ensureNumber(item.product.unit_price, 0);
      if (price >= 0) return price;
    }
  }
  
  return 0;
}

/**
 * Format items for database with robust fallback logic
 * Handles: array format, JSON strings, object maps, nested product data
 * Validates and filters out invalid items
 */
function formatItemsForDatabase(cartItems) {
  logger.info('Formatting items for database storage...');
  
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    logger.warn('No items to format');
    return [];
  }

  const formattedItems = cartItems
    .map((item, index) => {
      const name = extractItemName(item);
      const quantity = extractItemQuantity(item);
      const price = extractItemPrice(item);
      
      // Validate item
      if (!name || name === 'Unknown Item') {
        logger.warn(`  Item ${index + 1}: Skipping - no valid name found`);
        return null;
      }
      if (quantity <= 0) {
        logger.warn(`  Item ${index + 1}: Skipping - invalid quantity: ${quantity}`);
        return null;
      }
      if (price < 0) {
        logger.warn(`  Item ${index + 1}: Skipping - invalid price: ${price}`);
        return null;
      }
      
      const formattedItem = {
        name,
        quantity,
        price,
      };
      
      // Include optional fields if present
      if (item.id) formattedItem.id = item.id;
      if (item.sku) formattedItem.sku = item.sku;
      if (item.description) formattedItem.description = item.description;
      if (item.image) formattedItem.image = item.image;
      if (item.tax_type) formattedItem.tax_type = item.tax_type;
      if (item.tax_percentage) formattedItem.tax_percentage = item.tax_percentage;
      if (item.category) formattedItem.category = item.category;
      
      logger.info(`  Item ${index + 1}: ${formattedItem.name} (qty: ${formattedItem.quantity}, price: ${formattedItem.price})`);
      return formattedItem;
    })
    .filter(item => item !== null);

  logger.info(`✅ Formatted ${formattedItems.length} items for database`);
  return formattedItems;
}

router.post('/create-order', requireCustomer, async (req, res) => {
  logger.info('===== POST /razorpay/create-order CALLED =====');
  logger.info(`Processing payment with ${isTestMode ? 'TEST' : 'LIVE'} Razorpay credentials`);

  // Answer before doing any work, so the checkout button gets an immediate,
  // actionable reply instead of hanging on "Processing...".
  if (!isConfigured) {
    logger.error(`Razorpay keys missing — set ${KEY_ID_ENV} and ${KEY_SECRET_ENV}`);
    return respondNotConfigured(res, {
      integration: `Razorpay (${isTestMode ? 'test' : 'live'} mode)`,
      envKeys: [KEY_ID_ENV, KEY_SECRET_ENV],
    });
  }

  const {
    cartItems,
    subtotal,
    shippingCost,
    taxAmount,
    totalAmount,
    customerName,
    customerEmail,
    customerPhone
  } = req.body;

  // Validate cartItems early
  const authoritativeItems = await canonicalizeCartItems(cartItems);
  logger.info(`Received ${authoritativeItems.length} items in cart`);

  if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
    return res.status(400).json({ error: 'totalAmount must be a positive number' });
  }

  const expectedTax = calculateExtractedTaxFromItems(authoritativeItems);
  const expectedSubtotalExclusive = calculateSubtotalFromItems(authoritativeItems);
  const couponDiscount = await calculateCouponDiscount(req.body.couponCode, expectedSubtotalExclusive + expectedTax);
  const expectedTotal = expectedSubtotalExclusive + expectedTax + shippingCost - couponDiscount;

  logger.info(`Tax Verification -> Frontend Sent: Subtotal: ${subtotal}, Tax: ${taxAmount}, Total: ${totalAmount}`);
  logger.info(`Tax Verification -> Backend Calc: Subtotal(Excl): ${expectedSubtotalExclusive}, Tax: ${expectedTax}, Total: ${expectedTotal}`);
  
  if (Math.abs(expectedTotal - totalAmount) > 0.01) {
    return res.status(400).json({ error: 'The cart price has changed. Refresh the cart and try again.' });
  }

  if (!razorpayKeyId || !razorpayKeySecret) {
    logger.error('Razorpay credentials not configured');
    return respondNotConfigured(res, {
      integration: `Razorpay (${isTestMode ? 'test' : 'live'} mode)`,
      envKeys: [KEY_ID_ENV, KEY_SECRET_ENV],
    });
  }

  const amountInPaise = Math.round(totalAmount * 100);
  const receipt = `order_${Date.now()}`;

  const orderData = {
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: { customerEmail, customerName },
  };

  logger.info(`Creating Razorpay order with amount: ${totalAmount} INR (${amountInPaise} paise)`);
  const razorpayOrder = await getRazorpay().orders.create(orderData);
  logger.info(`✅ Razorpay order created: ${razorpayOrder.id}`);
  
  res.json({
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: razorpayOrder.receipt,
    status: razorpayOrder.status,
    key: razorpayKeyId,
  });
});

router.post('/verify-payment', requireCustomer, async (req, res) => {
  logger.info('===== POST /razorpay/verify-payment CALLED =====');
  logger.info(`Verifying payment with ${isTestMode ? 'TEST' : 'LIVE'} Razorpay credentials`);

  // Without the secret the HMAC below cannot be computed (crypto throws on an
  // undefined key), so bail out with the same actionable setup response.
  if (!isConfigured) {
    return respondNotConfigured(res, {
      integration: `Razorpay (${isTestMode ? 'test' : 'live'} mode)`,
      envKeys: [KEY_ID_ENV, KEY_SECRET_ENV],
    });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    cartItems,
    subtotal_amount,
    shipping_cost,
    tax_amount,
    total_amount,
    coupon_code,
    discount_amount,
    customer_name,
    customer_email,
    customer_phone,
    billing_details,
    shipping_address,
    shipping_method,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, error: 'Missing payment verification fields' });
  }

  const signatureString = `${razorpay_order_id}|${razorpay_payment_id}`;
  const hmac = crypto.createHmac('sha256', razorpayKeySecret);
  hmac.update(signatureString);
  const generated_signature = hmac.digest('hex');

  if (generated_signature !== razorpay_signature) {
    logger.error('Signature verification failed');
    return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
  }

  logger.info('✅ Payment signature verified successfully');

  const authenticatedUserId = req.auth.id;

  // Validate and format cartItems with hardened logic
  const authoritativeItems = await canonicalizeCartItems(cartItems);
  logger.info(`\n📦 ITEMS PROCESSING START`);
  logger.info(`Received ${authoritativeItems.length} items from request body`);
  const formattedItems = formatItemsForDatabase(authoritativeItems);
  logger.info(`📦 ITEMS PROCESSING END\n`);

  if (formattedItems.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid items in cart after formatting' });
  }

  let validatedShippingAddress = {
    name: '',
    phone: '',
    email: '',
    address: ''
  };

  if (shipping_address) {
    if (typeof shipping_address === 'object') {
      validatedShippingAddress.name = ensureString(shipping_address.name);
      validatedShippingAddress.phone = ensureString(shipping_address.phone);
      validatedShippingAddress.email = ensureString(shipping_address.email);
      validatedShippingAddress.address = ensureString(shipping_address.address);
    } else if (typeof shipping_address === 'string') {
      validatedShippingAddress.address = shipping_address;
    }
  }

  const validatedCustomerName = ensureString(customer_name);
  const validatedCustomerEmail = ensureString(customer_email);
  const validatedCustomerPhone = ensureString(customer_phone);

  if (!validatedCustomerName) {
    return res.status(400).json({ success: false, error: 'customer_name is required' });
  }
  if (!validatedCustomerEmail) {
    return res.status(400).json({ success: false, error: 'customer_email is required' });
  }
  if (!validatedCustomerPhone) {
    return res.status(400).json({ success: false, error: 'customer_phone is required' });
  }

  // Persist catalogue-derived values, never the client-provided price/tax values.
  const validatedSubtotal = calculateSubtotalFromItems(formattedItems);
  const validatedTaxAmount = calculateExtractedTaxFromItems(formattedItems);

  const validatedShippingCost = shippingCost;
  const validatedCouponDiscount = await calculateCouponDiscount(coupon_code, validatedSubtotal + validatedTaxAmount);
  const validatedTotalAmount = validatedSubtotal + validatedTaxAmount + validatedShippingCost - validatedCouponDiscount;

  if (Math.abs(ensureNumber(total_amount, 0) - validatedTotalAmount) > 0.01) {
    return res.status(400).json({ success: false, error: 'The submitted order total does not match the server calculation' });
  }

  // A valid HMAC proves Razorpay signed the response; fetching the order also
  // proves that it belongs to this account and was charged the server-calculated amount.
  const razorpayOrder = await getRazorpay().orders.fetch(razorpay_order_id);
  if (razorpayOrder.status !== 'paid' || Number(razorpayOrder.amount) !== Math.round(validatedTotalAmount * 100)) {
    logger.warn(`Razorpay order ${razorpay_order_id} failed final validation`, {
      status: razorpayOrder.status,
      amount: razorpayOrder.amount,
      expectedAmount: Math.round(validatedTotalAmount * 100),
    });
    return res.status(400).json({ success: false, error: 'Payment amount could not be verified. No order was created.' });
  }

  const orderNumber = await generateOrderId();
  const d = new Date();
  const DD = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const YY = String(d.getFullYear()).slice(-2);
  const dateStr = `${DD}${MM}${YY}`;

  let customer_id;
  const existingOrders = await pb.collection('orders').getList(1, 1, {
    filter: `customer_phone = "${validatedCustomerPhone}" && customer_id != ""`,
    $autoCancel: false
  });

  if (existingOrders.items.length > 0) {
    customer_id = existingOrders.items[0].customer_id;
  } else {
    const last4 = validatedCustomerPhone.slice(-4).padStart(4, '0');
    customer_id = `Cust-${dateStr}${last4}`;
  }

  const orderDataToPersist = {
    items: formattedItems,
    subtotal: validatedSubtotal,
    shipping_cost: validatedShippingCost,
    tax_amount: validatedTaxAmount,
    total_amount: validatedTotalAmount,
    customer_name: validatedCustomerName,
    customer_email: validatedCustomerEmail,
    customer_phone: validatedCustomerPhone,
    orderNumber: orderNumber,
    userId: authenticatedUserId,
    customer_id: customer_id,
    payment_status: 'completed',
    order_status: 'pending',
    shipping_status: 'pending',
    shipping_method: ensureString(shipping_method, 'standard'),
    coupon_code: coupon_code ? ensureString(coupon_code) : null,
    coupon_discount: validatedCouponDiscount,
    billing_details: billing_details || {},
    shipping_address: validatedShippingAddress,
  };

  logger.info('\n========== BEFORE MONGODB ORDER CREATION ==========');
  logger.info('Field-by-field validation:');
  
  const fieldValidationLog = [
    { name: 'items', value: `[Array with ${orderDataToPersist.items.length} items]`, type: typeof orderDataToPersist.items },
    { name: 'subtotal', value: orderDataToPersist.subtotal, type: typeof orderDataToPersist.subtotal },
    { name: 'shipping_cost', value: orderDataToPersist.shipping_cost, type: typeof orderDataToPersist.shipping_cost },
    { name: 'tax_amount', value: orderDataToPersist.tax_amount, type: typeof orderDataToPersist.tax_amount },
    { name: 'total_amount', value: orderDataToPersist.total_amount, type: typeof orderDataToPersist.total_amount },
    { name: 'customer_name', value: orderDataToPersist.customer_name, type: typeof orderDataToPersist.customer_name },
    { name: 'customer_email', value: orderDataToPersist.customer_email, type: typeof orderDataToPersist.customer_email },
    { name: 'customer_phone', value: orderDataToPersist.customer_phone, type: typeof orderDataToPersist.customer_phone },
    { name: 'orderNumber', value: orderDataToPersist.orderNumber, type: typeof orderDataToPersist.orderNumber },
    { name: 'userId', value: orderDataToPersist.userId, type: typeof orderDataToPersist.userId },
    { name: 'customer_id', value: orderDataToPersist.customer_id, type: typeof orderDataToPersist.customer_id },
    { name: 'payment_status', value: orderDataToPersist.payment_status, type: typeof orderDataToPersist.payment_status },
    { name: 'order_status', value: orderDataToPersist.order_status, type: typeof orderDataToPersist.order_status },
    { name: 'shipping_status', value: orderDataToPersist.shipping_status, type: typeof orderDataToPersist.shipping_status },
    { name: 'shipping_method', value: orderDataToPersist.shipping_method, type: typeof orderDataToPersist.shipping_method },
    { name: 'coupon_code', value: orderDataToPersist.coupon_code, type: typeof orderDataToPersist.coupon_code },
    { name: 'coupon_discount', value: orderDataToPersist.coupon_discount, type: typeof orderDataToPersist.coupon_discount },
    { name: 'billing_details', value: JSON.stringify(orderDataToPersist.billing_details), type: typeof orderDataToPersist.billing_details },
    { name: 'shipping_address', value: JSON.stringify(orderDataToPersist.shipping_address), type: typeof orderDataToPersist.shipping_address },
  ];

  fieldValidationLog.forEach(field => {
    logger.info(`  [${field.type}] ${field.name}: ${field.value}`);
  });

  logger.info('\n📦 ITEMS ARRAY DETAILS:');
  orderDataToPersist.items.forEach((item, idx) => {
    logger.info(`  Item ${idx + 1}: ${JSON.stringify(item)}`);
  });

  logger.info('\nComplete order object as JSON:');
  logger.info(JSON.stringify(orderDataToPersist, null, 2));
  logger.info('========== END FIELD VALIDATION ==========\n');

  // Create the verified payment order in MongoDB.
  const createdOrder = await pb.collection('orders').create(orderDataToPersist);

  logger.info(`✅ Order created successfully in MongoDB with ID: ${createdOrder.id}`);
  logger.info(`Order number: ${createdOrder.orderNumber}`);
  logger.info(`\n📦 VERIFICATION - Items saved to database:`);
  
  if (createdOrder.items && Array.isArray(createdOrder.items)) {
    logger.info(`  Total items in database: ${createdOrder.items.length}`);
    createdOrder.items.forEach((item, idx) => {
      logger.info(`    Item ${idx + 1}: ${item.name} (qty: ${item.quantity}, price: ${item.price})`);
    });
  } else {
    logger.warn('  ⚠️ Items field is missing or not an array in database response');
  }
  

  res.json({
    success: true,
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    message: 'Order created successfully',
  });
});

export default router;

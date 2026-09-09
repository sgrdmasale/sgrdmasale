/**
 * Tax Calculation Utilities
 * 
 * All product prices in the system are TAX-INCLUSIVE.
 * Tax is extracted from the price, NEVER added on top.
 */

/**
 * Extracts tax amount from a tax-inclusive price.
 * Formula: Tax Amount = Price * (Tax Rate / (100 + Tax Rate))
 * 
 * @param {number} price - The tax-inclusive price
 * @param {number|string} taxRate - The tax percentage (e.g., 18 or "18%")
 * @returns {number} The extracted tax amount
 */
export const calculateTaxFromPrice = (price, taxRate) => {
  const rate = parseFloat(taxRate?.toString().replace('%', '') || 0);
  if (rate <= 0) return 0;
  return price * (rate / (100 + rate));
};

/**
 * Calculates the total extracted tax for an array of products.
 * @param {Array} products - Array of product objects (must have price, quantity, tax_type)
 * @returns {number} Total extracted tax amount
 */
export const calculateExtractedTax = (products) => {
  if (!Array.isArray(products)) return 0;
  return products.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    // Uses tax_type (e.g., "18%") if available, else defaults to 0
    const taxRate = item.tax_type || item.tax_percentage || 0; 
    const itemTax = calculateTaxFromPrice(price, taxRate);
    return sum + (itemTax * qty);
  }, 0);
};

/**
 * Calculates the base subtotal (exclusive of tax) from tax-inclusive products.
 * Subtotal (exclusive) = Sum of inclusive prices - Extracted Tax
 * 
 * @param {Array} products - Array of product objects
 * @returns {number} Subtotal exclusive of tax
 */
export const calculateSubtotal = (products) => {
  if (!Array.isArray(products)) return 0;
  const inclusiveSum = products.reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1));
  }, 0);
  return inclusiveSum - calculateExtractedTax(products);
};

/**
 * Calculates the final order total.
 * Final Total = Subtotal (exclusive) + Extracted Tax + Shipping - Discount
 * This equals: Sum of Inclusive Prices + Shipping - Discount
 * 
 * @param {number} subtotal - Base subtotal (exclusive of tax)
 * @param {number} tax - Extracted tax amount
 * @param {number} shipping - Shipping cost
 * @param {number} discount - Coupon discount amount
 * @returns {number} Final order total
 */
export const calculateOrderTotal = (subtotal, tax, shipping, discount) => {
  return Number(subtotal || 0) + Number(tax || 0) + Number(shipping || 0) - Number(discount || 0);
};

/**
 * Helper to get the inclusive sum of products
 */
export const calculateInclusiveSum = (products) => {
  if (!Array.isArray(products)) return 0;
  return products.reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1));
  }, 0);
};
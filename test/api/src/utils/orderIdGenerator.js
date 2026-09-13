import 'dotenv/config';
import { getDb } from './mongoClient.js';
import { getModel } from '../models/index.js';
import logger from './logger.js';

const COUNTER_COLLECTION = 'order_counter';
const COUNTER_RECORD_ID = 'global_counter';

/**
 * Initialize or get the global order counter
 * Creates the counter record if it doesn't exist
 *
 * @returns {Promise<Object>} Counter record with current sequence number
 */
async function initializeCounter() {
  await getDb();
  const counter = await getModel(COUNTER_COLLECTION).findOne({ id: COUNTER_RECORD_ID }).lean();
  if (counter) return counter;
  await getModel(COUNTER_COLLECTION).create({ id: COUNTER_RECORD_ID, collectionName: COUNTER_COLLECTION, sequence_number: 0 });
  return { id: COUNTER_RECORD_ID, sequence_number: 0 };
}

/**
 * Increment the global order counter and return the new sequence number
 * This ensures continuous sequential numbering across all days
 *
 * @returns {Promise<number>} New sequence number (3-digit padded)
 */
async function incrementCounter() {
  try {
    await initializeCounter();
    const updatedCounter = await getModel(COUNTER_COLLECTION).findOneAndUpdate(
      { id: COUNTER_RECORD_ID },
      { $inc: { sequence_number: 1 } },
      { returnDocument: 'after' },
    );
    const newSequence = updatedCounter.sequence_number;
    const currentSequence = newSequence - 1;

    logger.info(`Counter incremented: ${currentSequence} → ${newSequence}`);
    return newSequence;
  } catch (error) {
    logger.error(`Failed to increment counter: ${error.message}`);
    throw new Error(`Unable to increment order counter: ${error.message}`);
  }
}

/**
 * Generate a unique order ID with continuous sequential numbering
 * Format: ODR-[DD][MM][YY][sequential_number]
 * Example: ODR-260426001, ODR-260426002, etc.
 *
 * The sequential_number is a continuous 3-digit counter (001, 002, 003, ...)
 * that increments across all days WITHOUT resetting at the start of each new day.
 *
 * @returns {Promise<string>} Generated order number
 * @throws {Error} If unable to generate order ID
 */
export async function generateOrderId() {
  logger.info('Generating new order ID with continuous sequential numbering...');

  try {
    // Get current date
    const d = new Date();
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YY = String(d.getFullYear()).slice(-2);
    const dateStr = `${DD}${MM}${YY}`;

    // Increment counter and get new sequence number
    const sequenceNumber = await incrementCounter();
    const paddedSequence = String(sequenceNumber).padStart(3, '0');

    // Format: ODR-DDMMYY{3-digit-sequence}
    const orderNumber = `ODR-${dateStr}${paddedSequence}`;

    logger.info(`✅ Generated order ID: ${orderNumber}`);
    logger.info(`   Date: ${DD}/${MM}/${YY}, Sequence: ${paddedSequence}`);
    return orderNumber;
  } catch (error) {
    logger.error(`Failed to generate order ID: ${error.message}`);
    throw new Error(`Unable to generate order ID: ${error.message}`);
  }
}

export default generateOrderId;

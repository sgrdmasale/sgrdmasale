import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/rates', async (req, res) => {
  const { pincode, weight } = req.body;

  if (!pincode || !weight) {
    return res.status(400).json({ error: 'pincode and weight are required' });
  }

  if (typeof weight !== 'number' || weight <= 0) {
    return res.status(400).json({ error: 'weight must be a positive number' });
  }

  const apiKey = process.env.DELHIVERY_API_KEY;
  const url = `https://track.delhivery.com/api/kinko/v1/invoice/charges/?pincode=${pincode}&weight=${weight}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Delhivery API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const shippingOptions = data.data?.map((item) => ({
    service_name: item.service_name || item.name || 'Standard Shipping',
    rate: parseFloat(item.charges) || 0,
    estimated_days: item.etd || 3,
  })) || [];

  res.json(shippingOptions);
});

export default router;
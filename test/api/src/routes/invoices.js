import express from 'express';
import PDFDocument from 'pdfkit';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const GST_NUMBER = '03AOIPS3078Q1Z9';
const BUSINESS_NAME = 'Your Business Name';
const BUSINESS_ADDRESS = 'Your Business Address, City, State, PIN';
const BUSINESS_EMAIL = 'business@example.com';
const BUSINESS_PHONE = '+91-XXXXXXXXXX';

function generateInvoiceNumber() {
  const timestamp = Date.now();
  const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${timestamp}-${randomDigits}`;
}

router.post('/generate', async (req, res) => {
  const { orderId, items, subtotal, tax_amount, total_amount, customer_name, customer_email, customer_address } = req.body;

  if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'orderId and items array are required' });
  }

  if (subtotal === undefined || tax_amount === undefined || total_amount === undefined) {
    return res.status(400).json({ error: 'subtotal, tax_amount, and total_amount are required' });
  }

  if (!customer_name || !customer_email || !customer_address) {
    return res.status(400).json({ error: 'customer_name, customer_email, and customer_address are required' });
  }

  const invoiceNumber = generateInvoiceNumber();
  const invoiceDate = new Date().toISOString();

  const invoiceRecord = await pb.collection('invoices').create({
    invoice_number: invoiceNumber,
    order_id: orderId,
    invoice_date: invoiceDate,
    items: JSON.stringify(items),
    subtotal,
    tax_amount,
    total_amount,
    customer_name,
    customer_email,
    customer_address,
    gst_number: GST_NUMBER,
    business_name: BUSINESS_NAME,
    business_address: BUSINESS_ADDRESS,
    business_email: BUSINESS_EMAIL,
    business_phone: BUSINESS_PHONE,
  });

  res.json({
    invoice_id: invoiceRecord.id,
    invoice_number: invoiceNumber,
  });
});

router.get('/:invoiceId/pdf', async (req, res) => {
  const { invoiceId } = req.params;

  if (!invoiceId) {
    return res.status(400).json({ error: 'invoiceId is required' });
  }

  const invoice = await pb.collection('invoices').getOne(invoiceId);

  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);

  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text(BUSINESS_NAME, { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(BUSINESS_ADDRESS, { align: 'center' });
  doc.text(`Email: ${BUSINESS_EMAIL} | Phone: ${BUSINESS_PHONE}`, { align: 'center' });
  doc.text(`GST: ${GST_NUMBER}`, { align: 'center' });

  doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).stroke();
  doc.moveDown();

  doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
  doc.moveDown();

  doc.fontSize(10).font('Helvetica');
  doc.text(`Invoice Number: ${invoice.invoice_number}`);
  doc.text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`);
  doc.text(`Order ID: ${invoice.order_id}`);
  doc.moveDown();

  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
  doc.fontSize(10).font('Helvetica');
  doc.text(invoice.customer_name);
  doc.text(invoice.customer_address);
  doc.text(`Email: ${invoice.customer_email}`);
  doc.moveDown();

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  const tableTop = doc.y;
  const col1 = 60;
  const col2 = 250;
  const col3 = 400;
  const col4 = 500;

  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Item', col1, tableTop);
  doc.text('Description', col2, tableTop);
  doc.text('Qty', col3, tableTop);
  doc.text('Price', col4, tableTop);

  doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
  doc.moveDown();

  doc.font('Helvetica').fontSize(10);
  items.forEach((item, index) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    doc.text((index + 1).toString(), col1);
    doc.text(item.name || 'Product', col2, doc.y - 15);
    doc.text((item.quantity || 1).toString(), col3, doc.y - 15);
    doc.text(`$${itemTotal.toFixed(2)}`, col4, doc.y - 15);
    doc.moveDown();
  });

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  const summaryX = 400;
  doc.fontSize(10).font('Helvetica');
  doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, summaryX);
  doc.text(`Tax (GST): $${invoice.tax_amount.toFixed(2)}`, summaryX);
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`Total: $${invoice.total_amount.toFixed(2)}`, summaryX);

  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(9).font('Helvetica').text('Thank you for your business!', { align: 'center' });
  doc.text('This is a computer-generated invoice.', { align: 'center' });

  doc.end();
});

export default router;
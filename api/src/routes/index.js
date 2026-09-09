import { Router } from 'express';
import healthCheck from './health-check.js';
import shippingRouter from './shipping.js';
import invoicesRouter from './invoices.js';
import googleReviewsRouter from './google-reviews.js';
import razorpayRouter from './razorpay.js';
import ordersRouter from './orders.js';
import databaseRouter from './database.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/shipping', shippingRouter);
    router.use('/invoices', invoicesRouter);
    router.use('/google-reviews', googleReviewsRouter);
    router.use('/razorpay', razorpayRouter);
    router.use('/orders', ordersRouter);
    router.use('/db', databaseRouter);

    return router;
};

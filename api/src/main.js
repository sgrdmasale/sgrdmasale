import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit, authRateLimit, publicWriteLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import { closeMongo, getDb } from './utils/mongoClient.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
	logger.error('Uncaught exception:', error);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
	logger.info('Interrupted');
	await closeMongo();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('SIGTERM signal received');
	await closeMongo();

	await new Promise(resolve => setTimeout(resolve, 3000));

	logger.info('Exiting');
	process.exit();
});

app.use(helmet());
app.use(cors({
	origin: allowedOrigins.length ? allowedOrigins : false,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));
app.use('/uploads', express.static('uploads'));
// Same upload path under the frontend API prefix for direct/static deployments.
app.use('/hcgi/api/uploads', express.static('uploads'));

const applicationRoutes = routes();
app.use('/', applicationRoutes);
// Also accept the frontend's full API prefix when the backend is accessed
// directly (for example from a static production build without Vite proxy).
// Vite strips /hcgi/api before forwarding, so this does not change local dev.
app.use('/hcgi/api', applicationRoutes);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use(errorMiddleware);

async function startServer() {
	await getDb();
	const port = Number(process.env.PORT || 3001);
	const host = process.env.API_HOST || '127.0.0.1';

	app.listen(port, host, () => {
		logger.info(`API server listening on http://${host}:${port}`);
	});
}

if (process.env.NODE_ENV !== 'test') {
	startServer().catch((error) => {
		logger.error('Unable to start API:', error);
		process.exit(1);
	});
}

export default app;

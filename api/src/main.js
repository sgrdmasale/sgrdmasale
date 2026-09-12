// Side-effect import, and it must be the FIRST import in this file. ESM
// evaluates a module's imports before its own top-level code, in import
// order — so putting this first guarantees process.env is populated before
// any other imported module (e.g. mongo-auth.js, which reads JWT_SECRET at
// import time) evaluates. A plain `import dotenv from 'dotenv'; dotenv.config()`
// further down runs too late for those modules. Silently a no-op when no
// .env file exists (managed hosts that inject env vars directly), unlike
// `node --env-file=.env`, which exits if the file is missing.
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import { closeMongo, getDb } from './utils/mongoClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Serve the built frontend (web/dist) when it has been built alongside the
// API, so this one process is a complete deployment on hosts that run a
// single build+start command (no separate nginx/static host in front of it,
// e.g. a managed Node platform). On the VPS setup, where nginx serves
// web/dist directly and only forwards /hcgi/api to this process, requests
// never reach this block — it is inert there, not a second server to keep
// in sync. Skipped entirely when web/dist does not exist (local `npm run
// dev`, or an API-only deploy where the frontend is built elsewhere).
const webDist = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(path.join(webDist, 'index.html'))) {
	app.use(express.static(webDist));
	// SPA history fallback for any GET that isn't a static asset or one of
	// this API's own prefixes — those still fall through to the JSON 404
	// below so a bad API call gets a JSON error, not an HTML page.
	app.get(/^(?!\/hcgi\/api|\/uploads).*/, (req, res) => {
		res.sendFile(path.join(webDist, 'index.html'));
	});
	logger.info(`Serving frontend build from ${webDist}`);
}

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use(errorMiddleware);

async function startServer() {
	await getDb();
	const port = Number(process.env.PORT || 3001);
	// 0.0.0.0 by default so this listens correctly in a container/managed-host
	// deployment (Hostinger, etc.) with no nginx of its own in front of it. The
	// VPS setup pins this to 127.0.0.1 via api/.env, deliberately keeping the
	// API off the public interface — nginx is the only thing that reaches it
	// there, and that explicit env var always overrides this default.
	const host = process.env.API_HOST || '0.0.0.0';

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

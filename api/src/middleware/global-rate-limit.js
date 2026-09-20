import rateLimit from 'express-rate-limit';

// Uploaded images are plain static files and one page can pull dozens of them.
// They must not eat into the budget meant for API calls.
const isUploadRequest = (req) => req.path.startsWith('/uploads/') || req.path.startsWith('/hcgi/api/uploads/');

// General budget for every API call from one client IP.
export const globalRateLimit = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many requests, please try again later' },
	skip: isUploadRequest,
	validate: { trustProxy: false },
});

// Login attempts: strict, but only failed ones count, so normal use never hits it.
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	skipSuccessfulRequests: true,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many login attempts, please try again in a few minutes' },
	validate: { trustProxy: false },
});

// Anonymous writes (signup, contact and partnership forms). Signed-in users
// (customers checking out, admins doing bulk work) are not throttled by this.
export const publicWriteLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	skip: (req) => Boolean(req.auth),
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many submissions, please try again later' },
	validate: { trustProxy: false },
});

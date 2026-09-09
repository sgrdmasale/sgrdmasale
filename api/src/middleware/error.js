import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

const errorMiddleware = (err, req, res, next) => {
	logger.error(err.message, err.stack);

	if (res.headersSent) {
		return next(err);
	}
	if (err.name === 'ValidationError') return res.status(400).json({ message: 'Validation failed', errors: Object.values(err.errors).map((item) => item.message) });
	if (err.code === 11000) return res.status(409).json({ message: 'A record with that value already exists' });
	if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier' });

	res.status(500).json({
		message: 'Something went wrong!',
		...(process.env.NODE_ENV !== NodeEnv.Production && { error: { name: err.name, message: err.message } }),
	});
};

export default errorMiddleware;
export { errorMiddleware };

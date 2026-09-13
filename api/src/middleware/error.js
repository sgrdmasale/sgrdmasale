import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

const errorMiddleware = (err, req, res, next) => {
    // Log the complete error on the API server
    logger.error(err.message, err.stack);

    // If headers have already been sent, let Express handle it
    if (res.headersSent) {
        return next(err);
    }

    // =========================================================
    // MONGOOSE VALIDATION ERROR
    // =========================================================
    if (err.name === 'ValidationError') {
        console.error(
            'MONGOOSE VALIDATION ERRORS:',
            Object.fromEntries(
                Object.entries(err.errors || {}).map(([field, details]) => [
                    field,
                    {
                        message: details?.message,
                        value: details?.value,
                        kind: details?.kind,
                    },
                ])
            )
        );

        return res.status(400).json({
            message: 'Validation failed',

            errors: Object.values(err.errors || {}).map((item) => ({
                field: item.path,
                message: item.message,
                value: item.value,
            })),
        });
    }

    // =========================================================
    // DUPLICATE MONGODB RECORD
    // =========================================================
    if (err.code === 11000) {
        console.error(
            'MONGODB DUPLICATE KEY:',
            err.keyValue || err.keyPattern
        );

        return res.status(409).json({
            message: 'A record with that value already exists',
            ...(process.env.NODE_ENV !== NodeEnv.Production && {
                fields: err.keyValue || {},
            }),
        });
    }

    // =========================================================
    // INVALID MONGODB ID / CAST ERROR
    // =========================================================
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid record identifier',

            ...(process.env.NODE_ENV !== NodeEnv.Production && {
                field: err.path,
                value: err.value,
            }),
        });
    }

    // =========================================================
    // UNAUTHORIZED
    // =========================================================
    if (err.status === 401 || err.statusCode === 401) {
        return res.status(401).json({
            message: err.message || 'Authentication is required',
        });
    }

    // =========================================================
    // FORBIDDEN
    // =========================================================
    if (err.status === 403 || err.statusCode === 403) {
        return res.status(403).json({
            message: err.message || 'You are not authorized',
        });
    }

    // =========================================================
    // NOT FOUND
    // =========================================================
    if (err.status === 404 || err.statusCode === 404) {
        return res.status(404).json({
            message: err.message || 'Resource not found',
        });
    }

    // =========================================================
    // BAD REQUEST
    // =========================================================
    if (err.status === 400 || err.statusCode === 400) {
        return res.status(400).json({
            message: err.message || 'Bad request',
        });
    }

    // =========================================================
    // GENERAL SERVER ERROR
    // =========================================================
    const statusCode = Number(
        err.status || err.statusCode || 500
    );

    return res.status(
        statusCode >= 400 && statusCode < 600
            ? statusCode
            : 500
    ).json({
        message: 'Something went wrong!',

        ...(process.env.NODE_ENV !== NodeEnv.Production && {
            error: {
                name: err.name,
                message: err.message,
            },
        }),
    });
};

export default errorMiddleware;
export { errorMiddleware };
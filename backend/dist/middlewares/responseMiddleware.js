"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.responseMiddleware = void 0;
const responseMiddleware = (req, res, next) => {
    // Override res.json to wrap responses
    const originalJson = res.json;
    res.json = function (data) {
        // If it's already a formatted response, or an error, don't wrap again
        if (data && typeof data === 'object' && ('success' in data)) {
            return originalJson.call(this, data);
        }
        // Default success wrapper
        const formattedResponse = {
            success: true,
            data: data
        };
        return originalJson.call(this, formattedResponse);
    };
    next();
};
exports.responseMiddleware = responseMiddleware;
const errorMiddleware = (err, req, res, next) => {
    console.error('API Error:', err);
    const statusCode = err.status || 500;
    const message = err.message || 'An unexpected error occurred';
    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : undefined
    });
};
exports.errorMiddleware = errorMiddleware;

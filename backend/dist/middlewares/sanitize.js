"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = void 0;
/**
 * Middleware to sanitize all string fields in req.body
 * This helps prevent simple XSS attacks by stripping common HTML tags.
 */
const sanitize = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === 'string') {
                // Simple regex to strip HTML tags
                req.body[key] = req.body[key].replace(/<[^>]*>?/gm, '');
            }
        });
    }
    next();
};
exports.sanitize = sanitize;

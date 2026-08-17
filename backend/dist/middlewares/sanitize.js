"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = void 0;
const xss_1 = __importDefault(require("xss"));
/**
 * Middleware to sanitize all string fields in req.body, req.query, and req.params
 * This helps prevent XSS attacks using the maintained 'xss' library.
 */
const sanitize = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (!obj)
            return;
        Object.keys(obj).forEach((key) => {
            if (typeof obj[key] === 'string') {
                obj[key] = (0, xss_1.default)(obj[key]);
            }
            else if (typeof obj[key] === 'object') {
                sanitizeObject(obj[key]);
            }
        });
    };
    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);
    next();
};
exports.sanitize = sanitize;

import { Request, Response } from 'express';
import xss from 'xss';

/**
 * Middleware to sanitize all string fields in req.body, req.query, and req.params
 * This helps prevent XSS attacks using the maintained 'xss' library.
 */
export const sanitize = (req: Request, res: Response, next: any) => {
  const sanitizeObject = (obj: any) => {
    if (!obj) return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
  };

  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  
  next();
};

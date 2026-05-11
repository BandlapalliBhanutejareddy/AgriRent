import { Request, Response } from 'express';

/**
 * Middleware to sanitize all string fields in req.body
 * This helps prevent simple XSS attacks by stripping common HTML tags.
 */
export const sanitize = (req: Request, res: Response, next: any) => {
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

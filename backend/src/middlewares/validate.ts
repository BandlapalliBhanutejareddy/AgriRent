import { Request, Response } from 'express';
import { z, ZodObject, ZodError } from 'zod';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: any) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Failed',
          details: error.issues.map((e: any) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      return res.status(500).json({ error: 'Internal Server Error during validation' });
    }
  };
};

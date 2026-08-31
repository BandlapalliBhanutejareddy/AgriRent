import { Request, Response, NextFunction } from 'express';

export const responseMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Override res.json to wrap responses
  const originalJson = res.json;
  
  res.json = function (data) {
    // If it's already a formatted response, or an error, don't wrap again
    if (data && typeof data === 'object' && ('success' in data)) {
      return originalJson.call(this, data);
    }
    
    // Default success wrapper based on status code
    const isError = this.statusCode >= 400;
    const formattedResponse = {
      success: !isError,
      data: isError ? undefined : data,
      error: isError ? (data.error || data.message || 'An error occurred') : undefined
    };
    
    return originalJson.call(this, formattedResponse);
  };
  
  next();
};

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  
  const statusCode = err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
};

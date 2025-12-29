import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const result = validationResult(req);
  const statusCode = result.isEmpty() ? 500 : 400;
  const error = result.isEmpty() ? (err.message || 'Internal Server Error') : result.array();

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    error,
  });
};

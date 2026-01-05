import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/httpException';
import { isDev } from '../utils/env.util';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const isHttpException = err instanceof HttpException;

  const statusCode = isHttpException ? err.statusCode : 500;
  const errorMessage = isHttpException ? err.message : 'Internal Server Error';

  if (isDev()) {
    console.error('Error:', {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      url: req.url,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    error: errorMessage,
  });
};

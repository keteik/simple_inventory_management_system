import { validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';
import { BadRequestException } from '../exceptions/badRequestException';

export const validateSchema = (req: Request, _res: Response, next: NextFunction) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const validationError = result.array().map((err) => err.msg)[0];

    throw new BadRequestException(validationError);
  }

  next();
};

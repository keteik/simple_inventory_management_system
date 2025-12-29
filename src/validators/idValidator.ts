import { checkSchema } from 'express-validator';

export const createIdValidator = checkSchema({
  id: {
    in: 'params',
    isMongoId: {
      errorMessage: 'Invalid ID format',
    },
  },
});

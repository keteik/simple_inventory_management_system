import { checkSchema } from 'express-validator';

export const createOrderValidator = checkSchema({
  customerId: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Field customerId is required',
    },
    isMongoId: {
      errorMessage: 'Field customerId must be a valid ID',
    },
  },
  products: {
    in: 'body',
    isArray: {
      options: { min: 1 },
      errorMessage: 'Field products must be an array with at least one item',
    },
    notEmpty: {
      errorMessage: 'Field products cannot be empty',
    },
  },
  'products.*.productId': {
    in: 'body',
    notEmpty: {
      errorMessage: 'Field productId is required for each item',
    },
    isMongoId: {
      errorMessage: 'Field productId must be a valid ID',
    },
  },
  'products.*.quantity': {
    in: 'body',
    toInt: true,
    notEmpty: {
      errorMessage: 'Field quantity is required for each item',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Field quantity must be an integer greater than or equal to 1',
    },
  },
});

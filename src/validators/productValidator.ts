import { checkSchema } from 'express-validator';

export const createProductValidator = checkSchema({
  name: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Field name is required',
    },
    isString: {
      errorMessage: 'Field name must be a string',
    },
    isLength: {
      options: { min: 1, max: 50 },
      errorMessage: 'Field name must be between 1 and 50 characters',
    },
  },
  description: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Field description is required',
    },
    isString: {
      errorMessage: 'Field description must be a string',
    },
    isLength: {
      options: { min: 1, max: 50 },
      errorMessage: 'Field description must be between 1 and 50 characters',
    },
  },
  price: {
    in: 'body',
    toFloat: true,
    notEmpty: {
      errorMessage: 'Field price is required',
    },
    isFloat: {
      options: { gt: 0 },
      errorMessage: 'Field price must be a number greater than 0',
    },
  },
  stock: {
    in: 'body',
    toInt: true,
    notEmpty: {
      errorMessage: 'Field stock is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Field stock must be an integer greater than or equal to 1',
    },
  },
});

export const createProductRestocksValidator = checkSchema({
  stockToIncreaseBy: {
    in: 'body',
    toInt: true,
    notEmpty: {
      errorMessage: 'Field stockToIncreaseBy is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Field stockToIncreaseBy must be an integer greater than or equal to 1',
    },
  },
});

export const createProductSalesValidator = checkSchema({
  stockToDecreaseBy: {
    in: 'body',
    toInt: true,
    notEmpty: {
      errorMessage: 'Field stockToDecreaseBy is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Field stockToDecreaseBy must be an integer greater than or equal to 1',
    },
  },
});

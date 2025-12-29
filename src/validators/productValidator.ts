import { checkSchema } from "express-validator";

export const createProductValidator = checkSchema({
  name: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Name is required',
    },
    isString: {
      errorMessage: 'Name must be a string',
    },
    isLength: {
      options: { min: 1, max: 50 },
      errorMessage: 'Name must be between 1 and 50 characters',
    },
  },
  description: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Name is required',
    },
    isString: {
      errorMessage: 'Description must be a string',
    },
    isLength: {
      options: { min: 1, max: 50 },
      errorMessage: 'Description must be between 1 and 50 characters',
    },
  },
  price: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Name is required',
    },
    isFloat: {
      options: { min: 0, },
      errorMessage: 'Price must be a number greater than or equal to 0',
    },
  },
  stock: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Stock is required',
    },
    isInt: {
      options: { min: 0 },
      errorMessage: 'Stock must be an integer greater than or equal to 0',
    },
  },
})

export const createProductRestocksValidator = checkSchema({
  amount: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Amount is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Amount must be an integer greater than 0',
    },
  },
});

export const createProductSalesValidator = checkSchema({
  amount: {
    in: 'body',
    notEmpty: {
      errorMessage: 'Amount is required',
    },
    isInt: {
      options: { min: 1 },
      errorMessage: 'Amount must be an integer greater than 0',
    },
  },
});
import Decimal from 'decimal.js';

export const add = (a: number, b: number): number => {
  return new Decimal(a).plus(new Decimal(b)).toNumber();
};

export const subtract = (a: number, b: number): number => {
  return new Decimal(a).minus(new Decimal(b)).toNumber();
};

export const multiply = (a: number, b: number): number => {
  return new Decimal(a).mul(new Decimal(b)).toNumber();
};

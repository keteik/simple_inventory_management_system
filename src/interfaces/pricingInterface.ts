import { LocationCode } from './customerInterface';
import { IProduct, ProductCategory } from './productInterface';

// Base interface for pricing rules
interface IPricingRule {
  description: string;
  rate: number;
}

export enum DiscountType {
  VOLUME = 'volume',
  BLACK_FRIDAY = 'black_friday',
  HOLIDAY = 'holiday',
}

interface IDiscount {
  type: DiscountType;
}

// Volume discount rule interface
export interface IVolumeDiscountRule extends IPricingRule, IDiscount {
  minItems: number;
}

// Date-based discount rule interface
export interface IDateDiscountRule extends IPricingRule, IDiscount {
  dates: string[];
  categories: ProductCategory[];
}

// Location-based pricing rule interface
export interface ILocationPricingRule extends IPricingRule {
  location: LocationCode;
}

export interface IPriceCalculationInput {
  quantity: number;
  product: IProduct;
}

export interface IPriceCalculationResult {
  products: {
    product: IProduct;
    quantity: number;
    unitBasePrice: number;
    unitFinalPrice: number;
  }[];
  pricing: {
    basePrice: number;
    locationMultiplier: number;
    appliedDiscount?: Omit<IPriceAppliedDiscount, 'discountApplied'> | null;
    discountAmount: number;
    finalPrice: number;
  };
}

export interface IPriceAppliedDiscount {
  type: DiscountType;
  rate: number;
  discountApplied: number;
}

export interface IOrderProductPrice {
  quantity: number;
  product: IProduct;
  unitBasePrice: number;
}

export interface IPriceDiscountEvaluation {
  appliedDiscount?: IPriceAppliedDiscount;
  discountAmount: number;
}

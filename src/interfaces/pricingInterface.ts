import { LocationCode } from './customerInterface';
import { ProductCategory } from './productInterface';

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

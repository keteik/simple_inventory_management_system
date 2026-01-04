import { LocationCode } from './customerInterface';

interface PricingRule {
  description: string;
  rate: number;
}

export interface IVolumeDiscountRule extends PricingRule {
  minItems: number;
}

export interface IDateDiscountRule extends PricingRule {
  date: string;
}

export interface ILocationPricingRule extends PricingRule {
  location: LocationCode;
  operation: 'increase' | 'decrease';
}

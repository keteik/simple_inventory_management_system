import { Document, Schema } from 'mongoose';
import { DiscountType } from './pricingInterface';

interface IOrderProduct {
  productId: Schema.Types.ObjectId;
  quantity: number;
  unitBasePrice: number; // Price per unit with local adjustments but before discounts
  unitFinalPrice: number; // Price per unit after all discounts and adjustments
}

interface IOrderPricingDiscount {
  type: DiscountType;
  rate: number; // 0.25 | 0.10 | etc.
}

interface IOrderPricing {
  basePrice: number; // Quantity * unitBasePrice summed for all products
  locationTariffRate: number; // 0.15 | 0.05 | etc.
  appliedDiscount?: IOrderPricingDiscount;
  discountAmount: number;
  finalPrice: number;
}

// Order base schema
export interface IOrder extends Document {
  customerId: Schema.Types.ObjectId;
  products: Array<IOrderProduct>;
  pricing: IOrderPricing;
}

// Request body for creating a new order
export interface ICreateOrderBody {
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

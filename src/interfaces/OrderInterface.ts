import { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  customerId: Schema.Types.ObjectId;
  products: Array<{
    productId: Schema.Types.ObjectId;
    quantity: number;
    priceAtPurchase: number;
  }>;
  basePrice: number;
  finalPrice: number;
}

export interface ICreateOrderBody {
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
}

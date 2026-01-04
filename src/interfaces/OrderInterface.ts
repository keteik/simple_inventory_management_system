import { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  customerId: Schema.Types.ObjectId;
  items: Array<{
    productId: Schema.Types.ObjectId;
    quantity: number;
    priceAtPurchase: number;
  }>;
  totalAmount: number;
}

export interface ICreateOrderBody {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

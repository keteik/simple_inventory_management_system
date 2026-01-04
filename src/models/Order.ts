import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../interfaces/OrderInterface';

const OrderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1, set: (v: number) => Math.floor(v) },
        priceAtPurchase: {
          type: Number,
          required: true,
          min: 0,
          set: (v: number) => parseFloat(v.toFixed(2)),
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

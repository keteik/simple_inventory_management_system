import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../interfaces/orderInterface';
import { DiscountType } from '../interfaces/pricingInterface';

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
        unitBasePrice: {
          type: Number,
          required: true,
          min: 0,
          set: (v: number) => parseFloat(v.toFixed(2)),
        },
        unitFinalPrice: {
          type: Number,
          required: true,
          min: 0,
          set: (v: number) => parseFloat(v.toFixed(2)),
        },
      },
    ],
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
        set: (v: number) => parseFloat(v.toFixed(2)),
      },
      locationMultiplier: {
        type: Number,
        required: true,
        min: 0,
        set: (v: number) => parseFloat(v.toFixed(4)),
      },
      appliedDiscount: {
        type: {
          type: String,
          enum: DiscountType,
        },
        percentage: {
          type: Number,
          min: 0,
          max: 1,
          set: (v: number) => parseFloat(v.toFixed(4)),
        },
      },
      discountAmount: {
        type: Number,
        required: true,
        min: 0,
        set: (v: number) => parseFloat(v.toFixed(2)),
      },
      finalPrice: {
        type: Number,
        required: true,
        min: 0,
        set: (v: number) => parseFloat(v.toFixed(2)),
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

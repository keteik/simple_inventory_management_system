import mongoose, { Schema } from 'mongoose';
import { IProduct } from '../interfaces/ProductInterface';

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      set: (v: number) => parseFloat(v.toFixed(2)), // Ensure two decimal places
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      set: (v: number) => Math.floor(v), // Ensure stock is an integer
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);

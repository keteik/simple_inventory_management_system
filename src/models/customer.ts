import mongoose, { Schema } from 'mongoose';
import { ICustomer } from '../interfaces/customerInterface';

const CustomerSchema: Schema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxLength: 255,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    locationCode: {
      type: String,
      required: true,
      trim: true,
      maxLength: 20,
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ email: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

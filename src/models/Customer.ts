import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  location: string;
}

const CustomerSchema: Schema = new Schema<ICustomer>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
    location: {
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

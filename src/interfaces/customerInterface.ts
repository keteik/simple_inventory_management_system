import { Document } from 'mongoose';

// Possible location codes for customers
export enum LocationCode {
  US = 'US',
  EU = 'EU',
  ASIA = 'ASIA',
}

// Customer base schema
export interface ICustomer extends Document {
  email: string;
  name: string;
  locationCode: LocationCode;
}

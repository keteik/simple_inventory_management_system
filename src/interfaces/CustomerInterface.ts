import { Document } from 'mongoose';

type LocationCode = 'US' | 'EU' | 'ASIA';

export interface ICustomer extends Document {
  email: string;
  name: string;
  locationCode: LocationCode;
}

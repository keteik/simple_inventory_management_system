import { Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface ICreateProductBody {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface IRestockProductBody {
  stockToIncreaseBy: number;
}

export interface ISellProductBody {
  stockToDecreaseBy: number;
}

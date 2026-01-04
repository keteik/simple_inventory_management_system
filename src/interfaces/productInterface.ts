import { Document } from 'mongoose';

export enum ProductCategory {
  ELECTRONICS = 'ELECTRONICS',
  BOOKS = 'BOOKS',
  CLOTHING = 'CLOTHING',
  HOME = 'HOME',
  TOYS = 'TOYS',
}

// Base schema for a product
export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
}

// Request body for creating a new product
export interface ICreateProductBody {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
}

// Request body for increasing product stock
export interface IRestockProductBody {
  stockToIncreaseBy: number;
}

// Request body for decreasing product stock
export interface ISellProductBody {
  stockToDecreaseBy: number;
}

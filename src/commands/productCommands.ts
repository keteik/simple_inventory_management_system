import { ProductCategory } from '../interfaces/productInterface';

// Create Product Command
export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly category: ProductCategory
  ) {}
}

// Restock Product Command
export class RestockProductCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      stockToIncreaseBy: number;
    }
  ) {}
}

// Sell Product Command
export class SellProductCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      stockToDecreaseBy: number;
    }
  ) {}
}

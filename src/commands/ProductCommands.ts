// Create Product Command
export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number
  ) {}
}

// Update Product Stock Command
export class UpdateProductStockCommand {
  constructor(
    public readonly id: string,
    public readonly data: {
      stock: number;
    }
  ) {}
}

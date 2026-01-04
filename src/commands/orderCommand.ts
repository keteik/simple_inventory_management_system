// Create Order Command
export class CreateOrderCommand {
  constructor(
    public readonly customerId: string,
    public readonly products: Array<{
      productId: string;
      quantity: number;
    }>
  ) {}
}

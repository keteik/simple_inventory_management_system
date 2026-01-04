import { IOrder } from '../interfaces/OrderInterface';

export class OrderDto {
  id: string;
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  basePrice: number;
  finalPrice: number;

  constructor(order: IOrder) {
    this.id = order._id.toString();
    this.customerId = order.customerId.toString();
    this.products = order.products.map((product) => ({
      productId: product.productId.toString(),
      quantity: product.quantity,
      priceAtPurchase: product.priceAtPurchase,
    }));
    this.basePrice = order.basePrice;
    this.finalPrice = order.finalPrice;
  }
}

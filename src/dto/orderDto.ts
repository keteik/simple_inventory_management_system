import { IOrder } from '../interfaces/orderInterface';
import { DiscountType } from '../interfaces/pricingInterface';

export class OrderDto {
  id: string;
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
    baseUnitPrice: number;
    finalUnitPrice: number;
  }>;
  pricing: {
    basePrice: number;
    finalPrice: number;
    locationTariffRate: number;
    appliedDiscount?: {
      type: DiscountType;
      rate: number;
    };
    discountAmount: number;
  };

  constructor(order: IOrder) {
    this.id = order._id.toString();
    this.customerId = order.customerId.toString();
    this.products = order.products.map((product) => ({
      productId: product.productId.toString(),
      quantity: product.quantity,
      baseUnitPrice: product.unitBasePrice,
      finalUnitPrice: product.unitFinalPrice,
    }));
    this.pricing = {
      basePrice: order.pricing.basePrice,
      finalPrice: order.pricing.finalPrice,
      locationTariffRate: order.pricing.locationTariffRate,
      appliedDiscount: order.pricing.appliedDiscount,
      discountAmount: order.pricing.discountAmount,
    };
  }
}

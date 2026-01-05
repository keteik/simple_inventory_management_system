import { ICustomer, LocationCode } from '../interfaces/customerInterface';
import {
  DiscountType,
  IDateDiscountRule,
  ILocationPricingRule,
  IPriceAppliedDiscount,
  IVolumeDiscountRule,
  IPriceCalculationInput,
  IPriceCalculationResult,
  IOrderProductPrice,
} from '../interfaces/pricingInterface';
import { ProductCategory } from '../interfaces/productInterface';
import { add, multiply, subtract } from '../utils/mathUtil';

export class PricingService {
  private readonly LOCATION_TARIFF: ILocationPricingRule[] = [
    {
      location: LocationCode.EU,
      rate: 1.15,
      description: 'Prices increased by 15% due to VAT',
    },
    {
      location: LocationCode.ASIA,
      rate: 0.95,
      description: 'Prices reduced by 5% due to lower logistics costs',
    },
  ];

  private readonly VOLUME_DISCOUNTS: IVolumeDiscountRule[] = [
    {
      minItems: 50,
      rate: 0.3,
      type: DiscountType.VOLUME,
      description: 'If a customer purchases 50 or more units, apply a 30% discount',
    },
    {
      minItems: 10,
      rate: 0.2,
      type: DiscountType.VOLUME,
      description: 'If a customer purchases 10 or more units, apply a 20% discount',
    },
    {
      minItems: 5,
      rate: 0.1,
      type: DiscountType.VOLUME,
      description: 'If a customer purchases 5 or more units, apply a 10% discount',
    },
  ];

  private readonly DATE_DISCOUNTS: IDateDiscountRule[] = [
    {
      type: DiscountType.BLACK_FRIDAY,
      rate: 0.25,
      description: 'Black Friday Sale: Apply a 25% discount on all products',
      dates: ['2025-11-29'],
      categories: [],
    },
    {
      type: DiscountType.HOLIDAY,
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
      dates: [
        '2025-01-01',
        '2025-01-06',
        '2025-04-20',
        '2025-04-21',
        '2025-05-01',
        '2025-05-03',
        '2025-06-08',
        '2025-06-19',
        '2025-08-15',
        '2025-11-01',
        '2025-11-11',
        '2025-12-24',
        '2025-12-25',
        '2025-12-26',
      ],
      categories: [ProductCategory.ELECTRONICS, ProductCategory.CLOTHING],
    },
  ];

  /**
   *  * Calculate the total price for an order considering location-based pricing and applicable discounts
   *  @param orderProducts - List of products and their quantities in the order
   * @param customer - Customer placing the order
   * */
  calculateOrderPrice(orderProducts: IPriceCalculationInput[], customer: ICustomer) {
    // 1. Get location tariff rate
    const locationTariff = this.getLocationTariffRate(customer.locationCode);

    //2 . Initialize pricing result
    const orderPricing: IPriceCalculationResult = {
      products: [],
      pricing: {
        basePrice: 0,
        locationTariffRate: locationTariff,
        appliedDiscount: null,
        discountAmount: 0,
        finalPrice: 0,
      },
    };

    // 3. Calculate unit prices and prepare order items
    for (const orderProduct of orderProducts) {
      const unitBasePrice = multiply(orderProduct.product.price, locationTariff);

      orderPricing.pricing.basePrice = add(
        orderPricing.pricing.basePrice,
        multiply(unitBasePrice, orderProduct.quantity)
      );
      orderPricing.products.push({
        product: orderProduct.product,
        quantity: orderProduct.quantity,
        unitBasePrice,
        unitFinalPrice: unitBasePrice, // If no discounts, final price equals base price
      });
    }

    // 4 . Determine and apply the best discount
    const discount = this.getDiscount(orderPricing.pricing.basePrice, orderPricing.products);
    if (discount) {
      orderPricing.pricing.appliedDiscount = discount;

      for (const item of orderPricing.products) {
        const discountUnitAmount = multiply(item.unitBasePrice, discount.rate);
        const discountedUnitPrice = subtract(item.unitBasePrice, discountUnitAmount);

        item.unitFinalPrice = discountedUnitPrice;
        orderPricing.pricing.discountAmount = add(
          orderPricing.pricing.discountAmount,
          multiply(discountUnitAmount, item.quantity)
        );
      }
    }

    // 5. Calculate final price after discount
    orderPricing.pricing.finalPrice = subtract(
      orderPricing.pricing.basePrice,
      orderPricing.pricing.discountAmount
    );

    return orderPricing;
  }

  // Determine the best applicable discount for the order
  private getDiscount(
    basePrice: number,
    orderProducts: IOrderProductPrice[]
  ): Omit<IPriceAppliedDiscount, 'discountApplied'> | null {
    // Determine the best applicable discount
    const bestDiscount = this.getBestDiscount(basePrice, orderProducts);

    return bestDiscount
      ? {
          rate: bestDiscount.rate,
          type: bestDiscount.type,
        }
      : null;
  }

  // Evaluate both volume and date-based discounts and return the best one
  private getBestDiscount(basePrice: number, orderProducts: IOrderProductPrice[]) {
    const orderedProductQuantity = orderProducts.reduce((sum, item) => sum + item.quantity, 0);
    const orderDate = new Date().toISOString().split('T')[0];

    // Get both discount rates
    const volumeDiscount = this.getVolumeDiscount(basePrice, orderedProductQuantity);
    const dateDiscount = this.getDateDiscount(basePrice, orderDate, orderProducts);

    const bestDiscount = [volumeDiscount, dateDiscount]
      .filter((d) => d !== null)
      .sort((a, b) => b.discountApplied - a.discountApplied)[0];

    return bestDiscount;
  }

  // Get volume discount based on total quantity ordered
  private getVolumeDiscount(
    basePrice: number,
    orderedProductQuantity: number
  ): IPriceAppliedDiscount | null {
    // Check total items matches any volume discount rules in descending order
    for (const discountRule of this.VOLUME_DISCOUNTS.sort((a, b) => b.minItems - a.minItems)) {
      if (orderedProductQuantity >= discountRule.minItems) {
        return {
          type: discountRule.type,
          discountApplied: multiply(basePrice, discountRule.rate),
          rate: discountRule.rate,
        };
      }
    }

    return null;
  }

  // Get date-based discount if the order date matches any discount rules
  private getDateDiscount(
    basePrice: number,
    orderDate: string,
    orderProducts: IOrderProductPrice[]
  ): IPriceAppliedDiscount | null {
    // Black Friday has precedence over holiday discounts
    const blackFridayDiscount = this.DATE_DISCOUNTS.find(
      (d) => d.dates.includes(orderDate) && d.type === 'black_friday'
    );
    if (blackFridayDiscount) {
      return {
        type: blackFridayDiscount.type,
        discountApplied: multiply(basePrice, blackFridayDiscount.rate),
        rate: blackFridayDiscount.rate,
      };
    }

    // Check for holiday discounts
    // Only some product categories are eligible
    const productCategories = orderProducts.map((item) => item.product.category);
    const holidayDiscount = this.DATE_DISCOUNTS.find(
      (d) =>
        d.dates.includes(orderDate) &&
        d.type === 'holiday' &&
        d.categories.some((category) => productCategories.includes(category))
    );
    if (holidayDiscount) {
      let totalHolidayDiscount = 0;
      for (const item of orderProducts) {
        if (holidayDiscount.categories.includes(item.product.category)) {
          // Calculate discount only for eligible categories
          const holidayDiscountAmount = multiply(item.unitBasePrice, holidayDiscount.rate);
          totalHolidayDiscount = add(totalHolidayDiscount, holidayDiscountAmount);
        }
      }

      return {
        type: holidayDiscount.type,
        discountApplied: totalHolidayDiscount,
        rate: holidayDiscount.rate,
      };
    }

    return null;
  }

  // Get location tariff rate based on customer's location
  private getLocationTariffRate(customerLocation: LocationCode) {
    // Check if customer's location has any pricing adjustments
    const locationTariff = this.LOCATION_TARIFF.find((lp) => lp.location === customerLocation);

    if (locationTariff) {
      return locationTariff.rate;
    }

    return 1;
  }
}

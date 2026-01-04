import { ICustomer, LocationCode } from '../interfaces/customerInterface';
import Decimal from 'decimal.js';
import {
  DiscountType,
  IDateDiscountRule,
  ILocationPricingRule,
  IVolumeDiscountRule,
} from '../interfaces/pricingInterface';
import { IProduct, ProductCategory } from '../interfaces/productInterface';

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

  calculateOrderPrice(
    orderProducts: {
      quantity: number;
      product: IProduct;
    }[],
    customer: ICustomer
  ) {
    const locationTariff = this.getLocationTariffRate(customer.locationCode);

    const orderPricing: {
      products: {
        product: IProduct;
        quantity: number;
        unitBasePrice: number;
        unitFinalPrice: number;
      }[];
      pricing: {
        basePrice: number;
        locationMultiplier: number;
        appliedDiscount?: {
          type: string;
          rate: number;
        };
        discountAmount: number;
        finalPrice: number;
      };
    } = {
      products: [],
      pricing: {
        basePrice: 0,
        locationMultiplier: locationTariff,
        appliedDiscount: undefined,
        discountAmount: 0,
        finalPrice: 0,
      },
    };

    // Calculate unit prices and prepare order items
    for (const orderProduct of orderProducts) {
      const unitBasePrice = new Decimal(orderProduct.product.price)
        .mul(locationTariff)
        .toDecimalPlaces(2)
        .toNumber();

      orderPricing.products.push({
        product: orderProduct.product,
        quantity: orderProduct.quantity,
        unitBasePrice,
        unitFinalPrice: unitBasePrice, // If no discounts, final price equals base price
      });

      orderPricing.pricing.basePrice = new Decimal(orderPricing.pricing.basePrice)
        .plus(unitBasePrice)
        .toDecimalPlaces(2)
        .toNumber();
    }

    const discount = this.getDiscount(orderPricing.pricing.basePrice, orderPricing.products);
    if (discount.appliedDiscount) {
      orderPricing.pricing.appliedDiscount = discount.appliedDiscount;

      for (const item of orderPricing.products) {
        const discountUnitAmount = new Decimal(item.unitBasePrice)
          .mul(discount.appliedDiscount.rate)
          .toDecimalPlaces(2)
          .toNumber();

        const discountedUnitPrice = new Decimal(item.unitBasePrice)
          .minus(discountUnitAmount)
          .toDecimalPlaces(2)
          .toNumber();
        item.unitFinalPrice = discountedUnitPrice;
        orderPricing.pricing.discountAmount = new Decimal(orderPricing.pricing.discountAmount)
          .plus(discountUnitAmount)
          .toDecimalPlaces(2)
          .toNumber();
      }
    }

    orderPricing.pricing.finalPrice =
      orderPricing.pricing.basePrice - orderPricing.pricing.discountAmount;

    return orderPricing;
  }

  private getDiscount(
    basePrice: number,
    orderProducts: {
      quantity: number;
      product: IProduct;
      unitBasePrice: number;
    }[]
  ) {
    // Determine the best applicable discount
    const bestDiscount = this.getBestDiscount(basePrice, orderProducts);

    return {
      appliedDiscount: bestDiscount
        ? {
            rate: bestDiscount.rate,
            type: bestDiscount.type,
          }
        : undefined,
    };
  }

  private getBestDiscount(
    basePrice: number,
    orderProducts: {
      quantity: number;
      product: IProduct;
      unitBasePrice: number;
    }[]
  ) {
    const orderedProductQuantity = orderProducts.reduce((sum, item) => sum + item.quantity, 0);
    const orderDate = new Date('2025-11-29').toISOString().split('T')[0];

    // Get both discount rates
    const volumeDiscount = this.getVolumeDiscount(basePrice, orderedProductQuantity);
    const dateDiscount = this.getDateDiscount(basePrice, orderDate, orderProducts);

    const bestDiscount = [volumeDiscount, dateDiscount]
      .filter((d) => d !== null)
      .sort((a, b) => b.discountApplied - a.discountApplied)[0];

    return bestDiscount;
  }

  private getVolumeDiscount(basePrice: number, orderedProductQuantity: number) {
    // Check total items matches any volume discount rules in descending order
    for (const discountRule of this.VOLUME_DISCOUNTS.sort((a, b) => b.minItems - a.minItems)) {
      if (orderedProductQuantity >= discountRule.minItems) {
        return {
          type: discountRule.type,
          discountApplied: new Decimal(basePrice)
            .mul(discountRule.rate)
            .toDecimalPlaces(2)
            .toNumber(),
          rate: discountRule.rate,
        };
      }
    }

    return null;
  }

  private getDateDiscount(
    basePrice: number,
    orderDate: string,
    orderProducts: {
      quantity: number;
      product: IProduct;
      unitBasePrice: number;
    }[]
  ) {
    // Black Friday has precedence over holiday discounts
    const blackFridayDiscount = this.DATE_DISCOUNTS.find(
      (d) => d.dates.includes(orderDate) && d.type === 'black_friday'
    );
    if (blackFridayDiscount) {
      return {
        type: blackFridayDiscount.type,
        discountApplied: new Decimal(basePrice)
          .mul(blackFridayDiscount.rate)
          .toDecimalPlaces(2)
          .toNumber(),
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
          const holidayDiscountAmount = new Decimal(item.unitBasePrice)
            .mul(holidayDiscount.rate)
            .toDecimalPlaces(2)
            .toNumber();
          totalHolidayDiscount = new Decimal(totalHolidayDiscount)
            .plus(holidayDiscountAmount)
            .toDecimalPlaces(2)
            .toNumber();
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

  private getLocationTariffRate(customerLocation: LocationCode) {
    // Check if customer's location has any pricing adjustments
    const locationTariff = this.LOCATION_TARIFF.find((lp) => lp.location === customerLocation);

    if (locationTariff) {
      return locationTariff.rate;
    }

    return 1;
  }
}

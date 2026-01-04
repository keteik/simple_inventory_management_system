import { ICustomer, LocationCode } from '../interfaces/CustomerInterface';
import { IOrder } from '../interfaces/OrderInterface';
import Decimal from 'decimal.js';
import {
  IDateDiscountRule,
  ILocationPricingRule,
  IVolumeDiscountRule,
} from '../interfaces/PricingInterface';

export class PricingService {
  private readonly VOLUME_DISCOUNTS: IVolumeDiscountRule[] = [
    {
      minItems: 50,
      rate: 0.3,
      description: 'If a customer purchases 50 or more units, apply a 30% discount',
    },
    {
      minItems: 10,
      rate: 0.2,
      description: 'If a customer purchases 10 or more units, apply a 20% discount',
    },
    {
      minItems: 5,
      rate: 0.1,
      description: 'If a customer purchases 5 or more units, apply a 10% discount',
    },
  ];

  private readonly DATE_DISCOUNTS: IDateDiscountRule[] = [
    {
      date: '2025-01-01',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-01-06',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-04-20',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-04-21',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-05-01',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-05-03',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-06-08',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-06-19',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-08-15',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-11-01',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-11-11',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-11-29',
      rate: 0.25,
      description: 'Black Friday Sale: Apply a 25% discount on all products',
    },
    {
      date: '2025-12-24',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-12-25',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
    {
      date: '2025-12-26',
      rate: 0.15,
      description: 'Holiday Sales: Apply a 15% discount on selected product categories',
    },
  ];

  private readonly LOCATION_PRICING: ILocationPricingRule[] = [
    {
      location: 'EU',
      rate: 0.15,
      description: 'Prices increased by 15% due to VAT',
      operation: 'increase',
    },
    {
      location: 'ASIA',
      rate: 0.05,
      description: 'Prices reduced by 5% due to lower logistics costs',
      operation: 'decrease',
    },
  ];

  calculateFinalPrice(
    customer: ICustomer,
    basePrice: number,
    orderItems: IOrder['products']
  ): number {
    // 1. Volume based discounts
    const volumeDiscount = this.calculateVolumeDiscount(basePrice, orderItems);

    // 2. Bank holiday discount
    const dateDiscount = this.calculateDateDiscount(
      basePrice,
      new Date().toISOString().split('T')[0]
    );

    // Chose only the higher discount
    const discount = Math.max(volumeDiscount, dateDiscount);

    // 3. Location based pricing adjustments
    const domesticTariff = this.calculateDomesticTariff(basePrice, customer.locationCode);

    // Final price calculation
    // Subtract discount and add domestic tariff
    return new Decimal(basePrice)
      .minus(discount)
      .plus(domesticTariff)
      .toDecimalPlaces(2)
      .toNumber();
  }

  calculateVolumeDiscount(basePrice: number, orderItems: IOrder['products']): number {
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // Check total items matches any volume discount rules in descending order
    for (const discountRule of this.VOLUME_DISCOUNTS.sort((a, b) => b.minItems - a.minItems)) {
      if (totalItems >= discountRule.minItems) {
        const volumeDiscount = new Decimal(basePrice)
          .mul(discountRule.rate)
          .toDecimalPlaces(2)
          .toNumber();

        return volumeDiscount;
      }
    }

    return 0;
  }

  calculateDateDiscount(basePrice: number, orderDate: string): number {
    // Check if the order date matches any predefined discount dates
    const dateDiscount = this.DATE_DISCOUNTS.find((d) => d.date === orderDate);
    if (dateDiscount) {
      return new Decimal(basePrice).mul(dateDiscount.rate).toDecimalPlaces(2).toNumber();
    }

    return 0;
  }

  calculateDomesticTariff(basePrice: number, customerLocation: LocationCode): number {
    // Check if customer's location has any pricing adjustments
    const domesticTariff = this.LOCATION_PRICING.find((lp) => lp.location === customerLocation);
    if (domesticTariff) {
      const locationAdjustment = new Decimal(basePrice)
        .mul(domesticTariff.rate)
        .toDecimalPlaces(2)
        .toNumber();

      /// Adjust price based on operation
      return domesticTariff.operation === 'increase' ? locationAdjustment : -locationAdjustment;
    }

    return 0;
  }
}

import { PricingService } from '../../services/pricingService';
import { LocationCode } from '../../interfaces/customerInterface';
import { ProductCategory } from '../../interfaces/productInterface';
import { ICustomer } from '../../interfaces/customerInterface';
import { IProduct } from '../../interfaces/productInterface';
import { DiscountType } from '../../interfaces/pricingInterface';
import { Types } from 'mongoose';

describe('PricingService - Unit Tests', () => {
  let pricingService: PricingService;

  beforeEach(() => {
    pricingService = new PricingService();
  });

  // Helper function to create mock product
  const createMockProduct = (
    price: number,
    category: ProductCategory = ProductCategory.ELECTRONICS
  ): Partial<IProduct> => ({
    _id: new Types.ObjectId(),
    name: 'Test Product',
    description: 'Test Description',
    price,
    stock: 100,
    category,
  });

  // Helper function to create mock customer
  const createMockCustomer = (locationCode: LocationCode): Partial<ICustomer> => ({
    _id: new Types.ObjectId(),
    email: 'test@test.com',
    name: 'Test Customer',
    locationCode,
  });

  describe('Location Tariff Calculation', () => {
    it('should apply no tariff for US customers (default rate)', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 1 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.locationTariffRate).toBe(1);
      expect(result.pricing.basePrice).toBe(100);
    });

    it('should apply 15% tariff for EU customers', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.EU) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 1 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.locationTariffRate).toBe(1.15);
      expect(result.pricing.basePrice).toBe(115);
    });

    it('should apply -5% discount for ASIA customers', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.ASIA) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 1 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.locationTariffRate).toBe(0.95);
      expect(result.pricing.basePrice).toBe(95);
    });
  });

  describe('Volume Discount Calculation', () => {
    it('should not apply volume discount for less than 5 items', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 4 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount).toBeNull();
      expect(result.pricing.discountAmount).toBe(0);
      expect(result.pricing.finalPrice).toBe(result.pricing.basePrice);
    });

    it('should apply 10% volume discount for 5-9 items', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 5 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount).toBeDefined();
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.1);
      expect(result.pricing.discountAmount).toBe(50); // 10% of 500
      expect(result.pricing.finalPrice).toBe(450);
    });

    it('should apply 20% volume discount for 10-49 items', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 10 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.2);
      expect(result.pricing.discountAmount).toBe(200); // 20% of 1000
      expect(result.pricing.finalPrice).toBe(800);
    });

    it('should apply 30% volume discount for 50+ items', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 50 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.3);
      expect(result.pricing.discountAmount).toBe(1500); // 30% of 5000
      expect(result.pricing.finalPrice).toBe(3500);
    });

    it('should apply volume discount based on total quantity across multiple products', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product1 = createMockProduct(100);
      const product2 = createMockProduct(50);
      const orderProducts = [
        { product: product1 as IProduct, quantity: 3 },
        { product: product2 as IProduct, quantity: 3 },
      ];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // Total: 6 items - should get 10% discount
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.1);
    });
  });

  describe('Unit Price Calculation', () => {
    it('should calculate correct unit base price with location tariff', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.EU) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 2 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.products[0].unitBasePrice).toBe(115); // 100 * 1.15
      expect(result.products[0].quantity).toBe(2);
    });

    it('should calculate correct unit final price with discount applied', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 10 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.products[0].unitBasePrice).toBe(100);
      expect(result.products[0].unitFinalPrice).toBe(80); // 100 - 20% discount
    });

    it('should keep unit base and final price same when no discount', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 2 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.products[0].unitBasePrice).toBe(100);
      expect(result.products[0].unitFinalPrice).toBe(100);
    });
  });

  describe('Multiple Products Pricing', () => {
    it('should correctly calculate pricing for multiple products', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product1 = createMockProduct(100);
      const product2 = createMockProduct(200);
      const orderProducts = [
        { product: product1 as IProduct, quantity: 2 },
        { product: product2 as IProduct, quantity: 3 },
      ];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.products).toHaveLength(2);
      expect(result.pricing.basePrice).toBe(800); // (100*2) + (200*3)
      expect(result.products[0].unitBasePrice).toBe(100);
      expect(result.products[1].unitBasePrice).toBe(200);
    });

    it('should apply discount to all products uniformly', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product1 = createMockProduct(100);
      const product2 = createMockProduct(200);
      const orderProducts = [
        { product: product1 as IProduct, quantity: 5 },
        { product: product2 as IProduct, quantity: 5 },
      ];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // Total: 10 items - 20% discount
      expect(result.products[0].unitFinalPrice).toBe(80); // 100 - 20%
      expect(result.products[1].unitFinalPrice).toBe(160); // 200 - 20%
    });
  });

  describe('Complex Scenarios', () => {
    it('should combine location tariff and volume discount correctly', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.EU) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 10 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // Base price: 100 * 1.15 * 10 = 1150
      // Volume discount: 20% = 230
      // Final price: 920
      expect(result.pricing.locationTariffRate).toBe(1.15);
      expect(result.pricing.basePrice).toBe(1150);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.2);
      expect(result.pricing.discountAmount).toBe(230);
      expect(result.pricing.finalPrice).toBe(920);
    });

    it('should handle ASIA location with volume discount', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.ASIA) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 50 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // Base price: 100 * 0.95 * 50 = 4750
      // Volume discount: 30% = 1425
      // Final price: 3325
      expect(result.pricing.locationTariffRate).toBe(0.95);
      expect(result.pricing.basePrice).toBe(4750);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.3);
      expect(result.pricing.discountAmount).toBe(1425);
      expect(result.pricing.finalPrice).toBe(3325);
    });

    it('should handle fractional unit prices correctly', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(99.99);
      const orderProducts = [{ product: product as IProduct, quantity: 1 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.basePrice).toBe(99.99);
      expect(result.products[0].unitBasePrice).toBe(99.99);
    });

    it('should handle large quantities correctly', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(10);
      const orderProducts = [{ product: product as IProduct, quantity: 100 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.basePrice).toBe(1000);
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.3);
      expect(result.pricing.finalPrice).toBe(700);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero quantity gracefully', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 0 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.basePrice).toBe(0);
      expect(result.pricing.finalPrice).toBe(0);
    });

    it('should handle single item orders', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 1 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.basePrice).toBe(100);
      expect(result.pricing.finalPrice).toBe(100);
      expect(result.pricing.appliedDiscount).toBeNull();
    });

    it('should handle boundary case at volume discount threshold (exactly 5 items)', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 5 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount?.rate).toBe(0.1);
    });

    it('should handle boundary case just below volume discount threshold (4 items)', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const product = createMockProduct(100);
      const orderProducts = [{ product: product as IProduct, quantity: 4 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.pricing.appliedDiscount).toBeNull();
    });

    it('should handle different product categories', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.US) as ICustomer;
      const electronicsProduct = createMockProduct(100, ProductCategory.ELECTRONICS);
      const clothingProduct = createMockProduct(50, ProductCategory.CLOTHING);
      const homeProduct = createMockProduct(200, ProductCategory.HOME);

      const orderProducts = [
        { product: electronicsProduct as IProduct, quantity: 1 },
        { product: clothingProduct as IProduct, quantity: 1 },
        { product: homeProduct as IProduct, quantity: 1 },
      ];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      expect(result.products).toHaveLength(3);
      expect(result.pricing.basePrice).toBe(350);
    });
  });

  describe('Precision and Rounding', () => {
    it('should handle decimal precision correctly', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.EU) as ICustomer;
      const product = createMockProduct(33.33);
      const orderProducts = [{ product: product as IProduct, quantity: 3 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // 33.33 * 1.15 * 3 should be calculated precisely
      expect(result.pricing.basePrice).toBeCloseTo(114.99, 2);
    });

    it('should maintain precision with complex calculations', () => {
      // Arrange
      const customer = createMockCustomer(LocationCode.ASIA) as ICustomer;
      const product = createMockProduct(123.45);
      const orderProducts = [{ product: product as IProduct, quantity: 10 }];

      // Act
      const result = pricingService.calculateOrderPrice(orderProducts, customer);

      // Assert
      // 123.45 * 0.95 * 10 = 1172.775
      // With 20% discount
      expect(result.pricing.basePrice).toBeCloseTo(1172.78, 2);
      expect(result.pricing.discountAmount).toBeCloseTo(234.56, 2);
      expect(result.pricing.finalPrice).toBeCloseTo(938.22, 2);
    });
  });
});

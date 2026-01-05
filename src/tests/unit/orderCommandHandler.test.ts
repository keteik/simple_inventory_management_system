/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from 'mongoose';
import { CreateOrderCommandHandler } from '../../handlers/orderCommandHandler';
import { CreateOrderCommand } from '../../commands/orderCommand';
import { PricingService } from '../../services/pricingService';
import { Product } from '../../models/product';
import { Order } from '../../models/order';
import { NotFoundException } from '../../exceptions/notFoundException';
import { BadRequestException } from '../../exceptions/badRequestException';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb';
import { createTestCustomers, createTestProducts } from '../helpers/testFixtures';
import { DiscountType } from '../../interfaces/pricingInterface';

describe('CreateOrderCommandHandler - Unit Tests', () => {
  let handler: CreateOrderCommandHandler;
  let pricingService: PricingService;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    pricingService = new PricingService();
    handler = new CreateOrderCommandHandler(pricingService);
  });

  describe('Successful Order Creation', () => {
    it('should create an order successfully with valid customer and products', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 2 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.customerId).toBe(usCustomer._id.toString());
      expect(result.products).toHaveLength(1);
      expect(result.products[0].productId).toBe(electronicsProduct._id.toString());
      expect(result.products[0].quantity).toBe(2);

      // Verify order is saved in database
      const orderInDb = await Order.findById(result.id);
      expect(orderInDb).toBeDefined();
      expect(orderInDb?.customerId.toString()).toBe(usCustomer._id.toString());
    });

    it('should create an order with multiple products', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct, clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
        { productId: clothingProduct._id.toString(), quantity: 3 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.products).toHaveLength(2);
      expect(result.products[0].quantity).toBe(1);
      expect(result.products[1].quantity).toBe(3);
    });

    it('should decrease product stock after successful order creation', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();
      const initialStock = electronicsProduct.stock;
      const orderQuantity = 5;

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: orderQuantity },
      ]);

      // Act
      await handler.handle(command);

      // Assert
      const updatedProduct = await Product.findById(electronicsProduct._id);
      expect(updatedProduct?.stock).toBe(initialStock - orderQuantity);
    });

    it('should apply location-based pricing for EU customer', async () => {
      // Arrange
      const { euCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();

      const command = new CreateOrderCommand(euCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // EU has 15% tariff (1.15x)
      expect(result.pricing.locationTariffRate).toBe(1.15);
      expect(result.pricing.basePrice).toBe(1150); // 1000 * 1.15
    });

    it('should apply location-based pricing for ASIA customer', async () => {
      // Arrange
      const { asiaCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();

      const command = new CreateOrderCommand(asiaCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // ASIA has -5% discount (0.95x)
      expect(result.pricing.locationTariffRate).toBe(0.95);
      expect(result.pricing.basePrice).toBe(950); // 1000 * 0.95
    });

    it('should apply volume discount when buying 5+ items', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: clothingProduct._id.toString(), quantity: 5 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // Base price: 50 * 5 = 250
      // Volume discount 10% should be applied
      expect(result.pricing.appliedDiscount).toBeDefined();
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.1);
      expect(result.pricing.discountAmount).toBe(25); // 10% of 250
      expect(result.pricing.finalPrice).toBe(225); // 250 - 25
    });

    it('should apply higher volume discount when buying 10+ items', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: clothingProduct._id.toString(), quantity: 10 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // Base price: 50 * 10 = 500
      // Volume discount 20% should be applied
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.2);
      expect(result.pricing.discountAmount).toBe(100); // 20% of 500
      expect(result.pricing.finalPrice).toBe(400); // 500 - 100
    });

    it('should apply highest volume discount when buying 50+ items', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: clothingProduct._id.toString(), quantity: 50 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // Base price: 50 * 50 = 2500
      // Volume discount 30% should be applied
      expect(result.pricing.appliedDiscount?.type).toBe(DiscountType.VOLUME);
      expect(result.pricing.appliedDiscount?.rate).toBe(0.3);
      expect(result.pricing.discountAmount).toBe(750); // 30% of 2500
      expect(result.pricing.finalPrice).toBe(1750); // 2500 - 750
    });

    it('should calculate correct unit prices with discounts applied', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: clothingProduct._id.toString(), quantity: 10 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.products[0].baseUnitPrice).toBe(50);
      // With 20% volume discount: 50 * 0.8 = 40
      expect(result.products[0].finalUnitPrice).toBe(40);
    });
  });

  describe('Error Handling', () => {
    it('should throw NotFoundException when customer does not exist', async () => {
      // Arrange
      const { electronicsProduct } = await createTestProducts();
      const nonExistentCustomerId = new mongoose.Types.ObjectId().toString();

      const command = new CreateOrderCommand(nonExistentCustomerId, [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
      ]);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(NotFoundException);
      await expect(handler.handle(command)).rejects.toThrow('Customer not found');
    });

    it('should throw NotFoundException when product does not exist', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const nonExistentProductId = new mongoose.Types.ObjectId().toString();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: nonExistentProductId, quantity: 1 },
      ]);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(NotFoundException);
      await expect(handler.handle(command)).rejects.toThrow(/Product with ID .* not found/);
    });

    it('should throw BadRequestException when product stock is insufficient', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { lowStockProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: lowStockProduct._id.toString(), quantity: 10 }, // Only 2 in stock
      ]);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(BadRequestException);
      await expect(handler.handle(command)).rejects.toThrow(/Insufficient stock for product/);
    });

    it('should throw error when one of multiple products does not exist', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();
      const nonExistentProductId = new mongoose.Types.ObjectId().toString();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
        { productId: nonExistentProductId, quantity: 1 },
      ]);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(NotFoundException);
    });

    it('should throw error when one of multiple products has insufficient stock', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct, lowStockProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
        { productId: lowStockProduct._id.toString(), quantity: 10 }, // Only 2 in stock
      ]);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Transaction Rollback', () => {
    it('should not create order or decrease stock when customer validation fails', async () => {
      // Arrange
      const { electronicsProduct } = await createTestProducts();
      const initialStock = electronicsProduct.stock;
      const nonExistentCustomerId = new mongoose.Types.ObjectId().toString();

      const command = new CreateOrderCommand(nonExistentCustomerId, [
        { productId: electronicsProduct._id.toString(), quantity: 5 },
      ]);

      // Act
      try {
        await handler.handle(command);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const productAfter = await Product.findById(electronicsProduct._id);
      const ordersCount = await Order.countDocuments();

      expect(productAfter?.stock).toBe(initialStock); // Stock unchanged
      expect(ordersCount).toBe(0); // No order created
    });

    it('should not create order or decrease stock when product stock validation fails', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { lowStockProduct } = await createTestProducts();
      const initialStock = lowStockProduct.stock;

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: lowStockProduct._id.toString(), quantity: 100 }, // Exceeds stock
      ]);

      // Act
      try {
        await handler.handle(command);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const productAfter = await Product.findById(lowStockProduct._id);
      const ordersCount = await Order.countDocuments();

      expect(productAfter?.stock).toBe(initialStock); // Stock unchanged
      expect(ordersCount).toBe(0); // No order created
    });

    it('should not decrease any product stock when multiple product order fails', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct, lowStockProduct } = await createTestProducts();
      const initialElectronicsStock = electronicsProduct.stock;
      const initialLowStock = lowStockProduct.stock;

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 5 },
        { productId: lowStockProduct._id.toString(), quantity: 100 }, // Exceeds stock
      ]);

      // Act
      try {
        await handler.handle(command);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      const electronicsAfter = await Product.findById(electronicsProduct._id);
      const lowStockAfter = await Product.findById(lowStockProduct._id);
      const ordersCount = await Order.countDocuments();

      expect(electronicsAfter?.stock).toBe(initialElectronicsStock); // Stock unchanged
      expect(lowStockAfter?.stock).toBe(initialLowStock); // Stock unchanged
      expect(ordersCount).toBe(0); // No order created
    });
  });

  describe('Edge Cases', () => {
    it('should handle order with quantity of 1', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 1 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.products[0].quantity).toBe(1);
    });

    it('should handle order that completely depletes product stock', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { lowStockProduct } = await createTestProducts();
      const exactStock = lowStockProduct.stock;

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: lowStockProduct._id.toString(), quantity: exactStock },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result).toBeDefined();
      const updatedProduct = await Product.findById(lowStockProduct._id);
      expect(updatedProduct?.stock).toBe(0);
    });

    it('should handle order with same product appearing multiple times', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct } = await createTestProducts();

      // Note: This tests the current behavior - the system treats these as separate line items
      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 2 },
        { productId: electronicsProduct._id.toString(), quantity: 3 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.products).toHaveLength(2);
      expect(result.products[0].quantity).toBe(2);
      expect(result.products[1].quantity).toBe(3);
    });
  });

  describe('Pricing Integration', () => {
    it('should correctly integrate with pricing service', async () => {
      // Arrange
      const { usCustomer } = await createTestCustomers();
      const { electronicsProduct, clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(usCustomer._id.toString(), [
        { productId: electronicsProduct._id.toString(), quantity: 2 },
        { productId: clothingProduct._id.toString(), quantity: 3 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      // Expected: (1000 * 2) + (50 * 3) = 2150 (base price)
      expect(result.pricing.basePrice).toBe(2150);
      expect(result.pricing.finalPrice).toBeGreaterThan(0);
      expect(result.pricing.finalPrice).toBeLessThanOrEqual(result.pricing.basePrice);
    });

    it('should store correct pricing information in order', async () => {
      // Arrange
      const { euCustomer } = await createTestCustomers();
      const { clothingProduct } = await createTestProducts();

      const command = new CreateOrderCommand(euCustomer._id.toString(), [
        { productId: clothingProduct._id.toString(), quantity: 10 },
      ]);

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result.pricing).toMatchObject({
        basePrice: expect.any(Number),
        locationTariffRate: expect.any(Number),
        discountAmount: expect.any(Number),
        finalPrice: expect.any(Number),
      });
      expect(result.pricing.appliedDiscount).toBeDefined();
    });
  });
});

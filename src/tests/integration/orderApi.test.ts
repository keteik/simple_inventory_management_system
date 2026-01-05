import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { connect, closeDatabase, clearDatabase } from '../helpers/testDb';
import { createTestCustomers, createTestProducts } from '../helpers/testFixtures';
import orderRoutes from '../../routes/orderRoutes';
import { errorHandler } from '../../middleware/errorHandler';
import { Order } from '../../models/order';
import { Product } from '../../models/product';
import { DiscountType } from '../../interfaces/pricingInterface';

describe('Order API - Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connect();

    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/orders', orderRoutes);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /orders - Create Order', () => {
    describe('Successful Order Creation', () => {
      it('should create an order with valid data and return 201', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 2,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 2,
              baseUnitPrice: 1000,
              finalUnitPrice: 1000,
            },
          ],
          pricing: {
            basePrice: 2000,
            locationTariffRate: 1,
            discountAmount: 0,
            finalPrice: 2000,
          },
        });
      });

      it('should create an order with multiple products', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct, clothingProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
            {
              productId: clothingProduct._id.toString(),
              quantity: 3,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.products).toHaveLength(2);
        expect(response.body.pricing.basePrice).toBe(1150); // 1000 + (50*3)
      });

      it('should apply location pricing for EU customer', async () => {
        // Arrange
        const { euCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: euCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.pricing.locationTariffRate).toBe(1.15);
        expect(response.body.pricing.basePrice).toBe(1150); // 1000 * 1.15
      });

      it('should apply location pricing for ASIA customer', async () => {
        // Arrange
        const { asiaCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: asiaCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.pricing.locationTariffRate).toBe(0.95);
        expect(response.body.pricing.basePrice).toBe(950); // 1000 * 0.95
      });

      it('should apply volume discount when buying 5+ items', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { clothingProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: clothingProduct._id.toString(),
              quantity: 5,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.pricing.appliedDiscount).toEqual({
          type: DiscountType.VOLUME,
          rate: 0.1,
        });
        expect(response.body.pricing.discountAmount).toBe(25);
        expect(response.body.pricing.finalPrice).toBe(225);
      });

      it('should apply volume discount when buying 10+ items', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { clothingProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: clothingProduct._id.toString(),
              quantity: 10,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.pricing.appliedDiscount).toEqual({
          type: DiscountType.VOLUME,
          rate: 0.2,
        });
        expect(response.body.pricing.discountAmount).toBe(100);
        expect(response.body.pricing.finalPrice).toBe(400);
      });

      it('should apply volume discount when buying 50+ items', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { clothingProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: clothingProduct._id.toString(),
              quantity: 50,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.pricing.appliedDiscount).toEqual({
          type: DiscountType.VOLUME,
          rate: 0.3,
        });
        expect(response.body.pricing.discountAmount).toBe(750);
        expect(response.body.pricing.finalPrice).toBe(1750);
      });

      it('should persist order in database', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 2,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        const orderInDb = await Order.findById(response.body.id);
        expect(orderInDb).toBeDefined();
        expect(orderInDb?.customerId.toString()).toBe(usCustomer._id.toString());
        expect(orderInDb?.products).toHaveLength(1);
      });

      it('should decrease product stock after order creation', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();
        const initialStock = electronicsProduct.stock;

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 5,
            },
          ],
        };

        // Act
        await request(app).post('/orders').send(orderData);

        // Assert
        const updatedProduct = await Product.findById(electronicsProduct._id);
        expect(updatedProduct?.stock).toBe(initialStock - 5);
      });

      it('should decrease stock for multiple products', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct, clothingProduct } = await createTestProducts();
        const initialElectronicsStock = electronicsProduct.stock;
        const initialClothingStock = clothingProduct.stock;

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 3,
            },
            {
              productId: clothingProduct._id.toString(),
              quantity: 5,
            },
          ],
        };

        // Act
        await request(app).post('/orders').send(orderData);

        // Assert
        const updatedElectronics = await Product.findById(electronicsProduct._id);
        const updatedClothing = await Product.findById(clothingProduct._id);
        expect(updatedElectronics?.stock).toBe(initialElectronicsStock - 3);
        expect(updatedClothing?.stock).toBe(initialClothingStock - 5);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 when customerId is missing', async () => {
        // Arrange
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when customerId is invalid', async () => {
        // Arrange
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: 'invalid-id',
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when products array is missing', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();

        const orderData = {
          customerId: usCustomer._id.toString(),
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when products array is empty', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when productId is missing in products', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when productId is invalid', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: 'invalid-id',
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when quantity is missing', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when quantity is less than 1', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 0,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should return 400 when quantity is not an integer', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 'abc',
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });
    });

    describe('Business Logic Errors', () => {
      it('should return 404 when customer does not exist', async () => {
        // Arrange
        const { electronicsProduct } = await createTestProducts();
        const nonExistentCustomerId = new mongoose.Types.ObjectId().toString();

        const orderData = {
          customerId: nonExistentCustomerId,
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(404);
      });

      it('should return 404 when product does not exist', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const nonExistentProductId = new mongoose.Types.ObjectId().toString();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: nonExistentProductId,
              quantity: 1,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(404);
      });

      it('should return 400 when product stock is insufficient', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { lowStockProduct } = await createTestProducts();

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: lowStockProduct._id.toString(),
              quantity: 100, // Only 2 in stock
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(400);
      });

      it('should not decrease stock when order fails due to insufficient stock', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { lowStockProduct } = await createTestProducts();
        const initialStock = lowStockProduct.stock;

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: lowStockProduct._id.toString(),
              quantity: 100,
            },
          ],
        };

        // Act
        await request(app).post('/orders').send(orderData);

        // Assert
        const updatedProduct = await Product.findById(lowStockProduct._id);
        expect(updatedProduct?.stock).toBe(initialStock);
      });

      it('should not create order when customer does not exist', async () => {
        // Arrange
        const { electronicsProduct } = await createTestProducts();
        const nonExistentCustomerId = new mongoose.Types.ObjectId().toString();

        const orderData = {
          customerId: nonExistentCustomerId,
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 1,
            },
          ],
        };

        // Act
        await request(app).post('/orders').send(orderData);

        // Assert
        const ordersCount = await Order.countDocuments();
        expect(ordersCount).toBe(0);
      });
    });

    describe('Transaction Rollback', () => {
      it('should not decrease stock of any product when multi-product order fails', async () => {
        // Arrange
        const { usCustomer } = await createTestCustomers();
        const { electronicsProduct, lowStockProduct } = await createTestProducts();
        const initialElectronicsStock = electronicsProduct.stock;
        const initialLowStock = lowStockProduct.stock;

        const orderData = {
          customerId: usCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 5,
            },
            {
              productId: lowStockProduct._id.toString(),
              quantity: 100, // Exceeds stock
            },
          ],
        };

        // Act
        await request(app).post('/orders').send(orderData);

        // Assert
        const updatedElectronics = await Product.findById(electronicsProduct._id);
        const updatedLowStock = await Product.findById(lowStockProduct._id);

        expect(updatedElectronics?.stock).toBe(initialElectronicsStock);
        expect(updatedLowStock?.stock).toBe(initialLowStock);
      });
    });

    describe('End-to-End Scenarios', () => {
      it('should handle complete order flow with EU customer and volume discount', async () => {
        // Arrange
        const { euCustomer } = await createTestCustomers();
        const { clothingProduct } = await createTestProducts();
        const initialStock = clothingProduct.stock;

        const orderData = {
          customerId: euCustomer._id.toString(),
          products: [
            {
              productId: clothingProduct._id.toString(),
              quantity: 10,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        // Base: 50 * 1.15 * 10 = 575
        // Discount: 20% = 115
        // Final: 460
        expect(response.body.pricing.basePrice).toBe(575);
        expect(response.body.pricing.appliedDiscount.rate).toBe(0.2);
        expect(response.body.pricing.finalPrice).toBe(460);

        // Verify stock decrease
        const updatedProduct = await Product.findById(clothingProduct._id);
        expect(updatedProduct?.stock).toBe(initialStock - 10);

        // Verify order persistence
        const orderInDb = await Order.findById(response.body.id);
        expect(orderInDb).toBeDefined();
      });

      it('should handle large order with multiple products and ASIA location', async () => {
        // Arrange
        const { asiaCustomer } = await createTestCustomers();
        const { electronicsProduct, clothingProduct, homeProduct } = await createTestProducts();

        const orderData = {
          customerId: asiaCustomer._id.toString(),
          products: [
            {
              productId: electronicsProduct._id.toString(),
              quantity: 20,
            },
            {
              productId: clothingProduct._id.toString(),
              quantity: 15,
            },
            {
              productId: homeProduct._id.toString(),
              quantity: 15,
            },
          ],
        };

        // Act
        const response = await request(app).post('/orders').send(orderData);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.products).toHaveLength(3);
        // 50 items total - should get 30% volume discount
        expect(response.body.pricing.appliedDiscount.rate).toBe(0.3);
        expect(response.body.pricing.locationTariffRate).toBe(0.95);
      });
    });
  });
});

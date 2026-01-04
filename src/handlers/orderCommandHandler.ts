import mongoose from 'mongoose';
import { CreateOrderCommand } from '../commands/orderCommand';
import { OrderDto } from '../dto/orderDto';
import { ICommandHandler } from '../interfaces/commandHandlerInterface';
import { NotFoundException } from '../exceptions/notFoundException';
import { BadRequestException } from '../exceptions/badRequestException';
import { PricingService } from '../services/pricingService';
import { Customer } from '../models/customer';
import { Product } from '../models/product';
import { Order } from '../models/order';

// Command Handler for Create Order
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand, OrderDto> {
  constructor(private readonly _pricingService: PricingService) {}

  async handle(command: CreateOrderCommand): Promise<OrderDto> {
    const session = await mongoose.startSession();

    try {
      // Start transaction
      return await session.withTransaction(async () => {
        //1. Verify customer exists
        const customer = await Customer.findById(command.customerId).session(session);
        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        //2. Verify products and calculate total amount, prepare order items, and stock updates
        // const totalBasePrice = 0;
        // const orderItems: IOrder['products'] = [];
        // const stockUpdates: Pick<IOrder['products'][0], 'productId' | 'quantity'>[] = [];

        const productsIds = command.products.map((product) => product.productId);
        const products = await Product.find({ _id: { $in: productsIds } }).session(session);

        const orderProducts = [];
        for (const orderProduct of command.products) {
          // Check if product exists
          const product = products.find((p) => p._id.toString() === orderProduct.productId);
          if (!product) {
            throw new NotFoundException(`Product with ID ${orderProduct.productId} not found`);
          }

          // Check stock availability
          if (product.stock < orderProduct.quantity) {
            throw new BadRequestException(`Insufficient stock for product ${product.name}`);
          }

          // Accumulate order products for pricing calculation
          orderProducts.push({
            product,
            quantity: orderProduct.quantity,
          });
        }

        const orderPricing = this._pricingService.calculateOrderPrice(orderProducts, customer);

        //3. Decrease product stock
        const result = await Product.bulkWrite(
          orderPricing.products.map((p) => ({
            updateOne: {
              filter: {
                _id: p.product._id,
                stock: { $gte: p.quantity }, // Ensure sufficient stock
              },
              update: { $inc: { stock: -p.quantity } },
            },
          })),
          { session }
        );

        // Ensure all stock updates were successful
        if (result.matchedCount !== orderPricing.products.length) {
          throw new BadRequestException(
            'Insufficient stock for one or more products during stock update'
          );
        }

        //5. Create Order
        const order = new Order({
          customerId: command.customerId,
          products: orderPricing.products.map((p) => ({
            productId: p.product._id,
            quantity: p.quantity,
            unitBasePrice: p.unitBasePrice,
            unitFinalPrice: p.unitFinalPrice,
          })),
          pricing: {
            basePrice: orderPricing.pricing.basePrice,
            finalPrice: orderPricing.pricing.finalPrice,
            locationMultiplier: orderPricing.pricing.locationMultiplier,
            appliedDiscount: orderPricing.pricing.appliedDiscount,
            discountAmount: orderPricing.pricing.discountAmount,
          },
        });

        await order.save({ session });

        // Commit transaction
        await session.commitTransaction();

        return new OrderDto(order);
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }
}

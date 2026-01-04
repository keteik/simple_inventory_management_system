import mongoose from 'mongoose';
import { CreateOrderCommand } from '../commands/OrderCommand';
import { OrderDto } from '../dto/OrderDto';
import { ICommandHandler } from '../interfaces/CommandHandlerInterface';
import { Customer } from '../models/Customer';
import { NotFoundException } from '../exceptions/NotFoundException';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { IOrder } from '../interfaces/OrderInterface';
import { BadRequestException } from '../exceptions/BadRequestException';

// Command Handler for Create Order
export class CreateOrderCommandHandler implements ICommandHandler<CreateOrderCommand, OrderDto> {
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
        let totalAmount = 0;
        const orderItems: IOrder['products'] = [];
        const stockUpdates: Pick<IOrder['products'][0], 'productId' | 'quantity'>[] = [];

        const productsIds = command.products.map((product) => product.productId);
        const products = await Product.find({ _id: { $in: productsIds } }).session(session);

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

          const priceAtPurchase = product.price;
          const itemTotalPrice = priceAtPurchase * orderProduct.quantity;
          totalAmount += itemTotalPrice;

          // Prepare order item
          orderItems.push({
            productId: product.id,
            quantity: orderProduct.quantity,
            priceAtPurchase,
          });

          // Prepare stock update
          stockUpdates.push({ productId: product.id, quantity: orderProduct.quantity });
        }

        //3. Decrease product stock
        const result = await Product.bulkWrite(
          stockUpdates.map((update) => ({
            updateOne: {
              filter: {
                _id: update.productId,
                stock: { $gte: update.quantity }, // Ensure sufficient stock
              },
              update: { $inc: { stock: -update.quantity } },
            },
          })),
          { session }
        );

        // Ensure all stock updates were successful
        if (result.matchedCount !== stockUpdates.length) {
          throw new BadRequestException(
            'Insufficient stock for one or more products during stock update'
          );
        }

        //4. Create Order
        const order = new Order({
          customerId: command.customerId,
          products: orderItems,
          totalAmount,
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

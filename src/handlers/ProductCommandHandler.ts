import { CreateProductCommand, UpdateProductStockCommand } from '../commands/ProductCommands';
import { NotFoundException } from '../common/exceptions/NotFound.exception';
import { ICommandHandler } from '../common/interfaces/CommandHandlerInterface';
import { IProduct, Product } from '../models/Product';

type CreateProductResultT = Pick<IProduct, 'id' | 'name' | 'description' | 'price' | 'stock'>;
type UpdateProductStockResultT = Pick<IProduct, 'id' | 'stock'>;

// Command Handler for Create Product
export class CreateProductCommandHandler implements ICommandHandler<
  CreateProductCommand,
  CreateProductResultT
> {
  async handle(command: CreateProductCommand): Promise<CreateProductResultT> {
    // Create new product
    const product = new Product({
      name: command.name,
      description: command.description,
      price: command.price,
      stock: command.stock,
    });

    await product.save();

    return {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    };
  }
}

export class UpdateProductStockCommandHandler implements ICommandHandler<
  UpdateProductStockCommand,
  UpdateProductStockResultT
> {
  async handle(command: UpdateProductStockCommand): Promise<UpdateProductStockResultT> {
    // Update product stock

    const product = await Product.findByIdAndUpdate(
      command.id,
      { $inc: { stock: command.data.stock } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      id: product._id,
      stock: product.stock,
    };
  }
}

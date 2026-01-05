import {
  CreateProductCommand,
  RestockProductCommand,
  SellProductCommand,
} from '../commands/productCommands';
import { ProductDto } from '../dto/productDto';
import { BadRequestException } from '../exceptions/badRequestException';
import { NotFoundException } from '../exceptions/notFoundException';
import { ICommandHandler } from '../interfaces/commandHandlerInterface';
import { Product } from '../models/product';

// Command Handler for Create Product
export class CreateProductCommandHandler implements ICommandHandler<
  CreateProductCommand,
  ProductDto
> {
  async handle(command: CreateProductCommand): Promise<ProductDto> {
    // Create new product
    const product = new Product({
      name: command.name,
      description: command.description,
      price: command.price,
      stock: command.stock,
      category: command.category,
    });

    await product.save();

    return new ProductDto(product);
  }
}

export class RestockProductCommandHandler implements ICommandHandler<
  RestockProductCommand,
  ProductDto
> {
  async handle(command: RestockProductCommand): Promise<ProductDto> {
    // Increase product stock
    const product = await Product.findByIdAndUpdate(
      command.id,
      { $inc: { stock: command.data.stockToIncreaseBy } },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return new ProductDto(product);
  }
}

export class SellProductCommandHandler implements ICommandHandler<SellProductCommand, ProductDto> {
  async handle(command: SellProductCommand): Promise<ProductDto> {
    // Decrease product stock
    // Ensure stock does not go below zero
    const product = await Product.findOneAndUpdate(
      { _id: command.id, stock: { $gte: command.data.stockToDecreaseBy } },
      { $inc: { stock: -command.data.stockToDecreaseBy } },
      { runValidators: true, new: true }
    );

    if (!product) {
      throw new BadRequestException(
        'Insufficient quantity: cannot decrease by ' + command.data.stockToDecreaseBy
      );
    }

    return new ProductDto(product);
  }
}

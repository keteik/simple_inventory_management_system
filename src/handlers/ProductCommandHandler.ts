import { CreateProductCommand } from "../commands/ProductCommands";
import { ICommandHandler } from "../common/interfaces/CommandHandlerInterface";
import { IProduct, Product } from "../models/Product";

type CreateProductResultT = Pick<IProduct, 'id' | 'name' | 'description' | 'price' | 'stock'>;

// Command Handler for Create Product
export class CreateProductCommandHandler implements ICommandHandler<CreateProductCommand, CreateProductResultT> {
  async handle(command: CreateProductCommand): Promise<CreateProductResultT> {
    try {

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
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }
      throw error;
    }
  }
}
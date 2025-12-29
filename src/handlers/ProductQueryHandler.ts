import { PaginatedResponse } from "../common/dto/PaginatedResponse";
import { IQueryHandler } from "../common/interfaces/QueryHandlerInterface";
import { IProduct, Product } from "../models/Product";
import { GetAllProductsQuery } from "../queries/ProductQueries";

type GetProductsResultT = Pick<IProduct, 'id' | 'name' | 'description' | 'price' | 'stock'>;

export class GetProductsQueryHandler implements IQueryHandler<GetAllProductsQuery, PaginatedResponse<GetProductsResultT>> {
  async handle(query: GetAllProductsQuery): Promise<PaginatedResponse<GetProductsResultT>> {
    try {
      const limit = query.limit;
      const skip = (query.page - 1) * limit;

      const [products, productsCount] = await Promise.all([
        Product.find().skip(skip).limit(limit),
        Product.countDocuments(),
      ]);

      return new PaginatedResponse(products.map(product => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      })), productsCount, query.page, limit);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get products: ${error.message}`);
      }
      throw error;
    }
  }
}
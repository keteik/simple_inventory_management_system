import { PaginatedResponse } from '../dto/paginatedResponse';
import { ProductDto } from '../dto/productDto';
import { IQueryHandler } from '../interfaces/queryHandlerInterface';
import { Product } from '../models/product';
import { GetAllProductsQuery } from '../queries/productQueries';

export class GetProductsQueryHandler implements IQueryHandler<
  GetAllProductsQuery,
  PaginatedResponse<ProductDto>
> {
  async handle(query: GetAllProductsQuery): Promise<PaginatedResponse<ProductDto>> {
    const limit = query.limit;
    const skip = (query.page - 1) * limit;

    const [products, productsCount] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments(),
    ]);

    return new PaginatedResponse(
      products.map((product) => new ProductDto(product)),
      productsCount,
      query.page,
      limit
    );
  }
}

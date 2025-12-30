import { PaginatedResponse } from '../dto/PaginatedResponse';
import { ProductDto } from '../dto/ProductDto';
import { IQueryHandler } from '../interfaces/QueryHandlerInterface';
import { Product } from '../models/Product';
import { GetAllProductsQuery } from '../queries/ProductQueries';

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

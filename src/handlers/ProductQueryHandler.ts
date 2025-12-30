import { PaginatedResponse } from '../dto/PaginatedResponse';
import { ProductDto } from '../dto/ProductDto';
import { IQueryHandler } from '../interfaces/QueryHandlerInterface';
import { IProduct, Product } from '../models/Product';
import { GetAllProductsQuery } from '../queries/ProductQueries';

type GetProductsResultT = Pick<IProduct, 'id' | 'name' | 'description' | 'price' | 'stock'>;

export class GetProductsQueryHandler implements IQueryHandler<
  GetAllProductsQuery,
  PaginatedResponse<GetProductsResultT>
> {
  async handle(query: GetAllProductsQuery): Promise<PaginatedResponse<GetProductsResultT>> {
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

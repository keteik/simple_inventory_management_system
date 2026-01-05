// Get All Products Query
export class GetAllProductsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10
  ) {}
}

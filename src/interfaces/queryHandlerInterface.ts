// Generic query handler interface
export interface IQueryHandler<Query, Result> {
  handle(query: Query): Promise<Result>;
}

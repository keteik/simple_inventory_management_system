import { NextFunction, Request, Response, Router } from 'express';
import {
  createProductRestocksValidator,
  createProductValidator,
} from '../validators/productValidator';
import { CreateProductCommand, UpdateProductStockCommand } from '../commands/ProductCommands';
import {
  CreateProductCommandHandler,
  UpdateProductStockCommandHandler,
} from '../handlers/ProductCommandHandler';
import { GetProductsQueryHandler } from '../handlers/ProductQueryHandler';
import { GetAllProductsQuery } from '../queries/ProductQueries';
import { createIdValidator } from '../validators/idValidator';
import { validateSchema } from '../middleware/schemaValidator';

interface ICreateProductBody {
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface IRestockProductBody {
  stock: number;
}

const router = Router();

// Command handlers instances
const createProductHandler = new CreateProductCommandHandler();
const updateProductStockHandler = new UpdateProductStockCommandHandler();

// Query handlers instances
const getAllProductsHandler = new GetProductsQueryHandler();

router.post(
  '/',
  createProductValidator,
  validateSchema,
  async (req: Request<object, object, ICreateProductBody>, res: Response, next: NextFunction) => {
    try {
      const { name, description, price, stock } = req.body;
      const command = new CreateProductCommand(name, description, price, stock);
      const product = await createProductHandler.handle(command);

      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

router.get('', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = new GetAllProductsQuery(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 10
    );
    const products = await getAllProductsHandler.handle(query);

    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id/restock',
  createIdValidator,
  createProductRestocksValidator,
  validateSchema,
  async (
    req: Request<{ id: string }, object, IRestockProductBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      const command = new UpdateProductStockCommand(id, { stock });
      const result = await updateProductStockHandler.handle(command);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

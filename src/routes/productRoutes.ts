import { NextFunction, Request, Response, Router } from 'express';
import {
  createProductRestocksValidator,
  createProductSalesValidator,
  createProductValidator,
} from '../validators/productValidator';
import {
  CreateProductCommand,
  RestockProductCommand,
  SellProductCommand,
} from '../commands/productCommands';
import {
  CreateProductCommandHandler,
  RestockProductCommandHandler,
  SellProductCommandHandler,
} from '../handlers/productCommandHandler';
import { GetProductsQueryHandler } from '../handlers/productQueryHandler';
import { GetAllProductsQuery } from '../queries/productQueries';
import { createIdValidator } from '../validators/idValidator';
import { validateSchema } from '../middleware/schemaValidator';
import {
  ICreateProductBody,
  IRestockProductBody,
  ISellProductBody,
} from '../interfaces/productInterface';

const router = Router();

// Command handlers instances
const createProductHandler = new CreateProductCommandHandler();
const restockProductHandler = new RestockProductCommandHandler();
const sellProductHandler = new SellProductCommandHandler();

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
      const { stockToIncreaseBy } = req.body;

      const command = new RestockProductCommand(id, { stockToIncreaseBy });
      const result = await restockProductHandler.handle(command);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id/sell',
  createIdValidator,
  createProductSalesValidator,
  validateSchema,
  async (
    req: Request<{ id: string }, object, ISellProductBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { stockToDecreaseBy } = req.body;

      const command = new SellProductCommand(id, { stockToDecreaseBy });
      const result = await sellProductHandler.handle(command);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

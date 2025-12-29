import { NextFunction, Request, Response, Router } from "express";
import { createProductValidator } from "../validators/productValidator";
import { CreateProductCommand } from "../commands/ProductCommands";
import { CreateProductCommandHandler } from "../handlers/ProductCommandHandler";
import { GetProductsQueryHandler } from "../handlers/ProductQueryHandler";
import { GetAllProductsQuery } from "../queries/ProductQueries";

interface IProductBody {
  name: string;
  description: string;
  price: number;
  stock: number;
}

const router = Router()

// Command handlers instances
const createProductHandler = new CreateProductCommandHandler();

// Query handlers instances
const getAllProductsHandler = new GetProductsQueryHandler();

router.post('/', createProductValidator, async (req: Request<object, object, IProductBody>, res: Response, next: NextFunction) => {
  try {
      const { name, description, price, stock } = req.body;
      const command = new CreateProductCommand(name, description, price, stock);
      const product = await createProductHandler.handle(command);

      res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

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

export default router;
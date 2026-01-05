import { Router, Request, Response, NextFunction } from 'express';
import { ICreateOrderBody } from '../interfaces/orderInterface';
import { createOrderValidator } from '../validators/orderValidator';
import { validateSchema } from '../middleware/schemaValidator';
import { CreateOrderCommandHandler } from '../handlers/orderCommandHandler';
import { CreateOrderCommand } from '../commands/orderCommand';
import { PricingService } from '../services/pricingService';

const router = Router();

// Command handler instance
const createOrderHandler = new CreateOrderCommandHandler(new PricingService());

router.post(
  '/',
  createOrderValidator,
  validateSchema,
  async (req: Request<object, object, ICreateOrderBody>, res: Response, next: NextFunction) => {
    try {
      const { customerId, products } = req.body;
      const command = new CreateOrderCommand(customerId, products);
      const order = await createOrderHandler.handle(command);

      res.status(201).send(order);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

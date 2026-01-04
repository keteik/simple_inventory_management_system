import { CreateCustomerCommand } from '../commands/customerCommands';
import { ICommandHandler } from '../interfaces/commandHandlerInterface';
import { Customer } from '../models/customer';

// Command Handler for Create Customer
export class CreateCustomerCommandHandler implements ICommandHandler<CreateCustomerCommand, void> {
  async handle(command: CreateCustomerCommand): Promise<void> {
    const customer = new Customer({
      email: command.email,
      name: command.name,
      location: command.location,
    });

    await customer.save();
  }
}

import { CreateCustomerCommand } from '../commands/CustomerCommands';
import { ICommandHandler } from '../interfaces/CommandHandlerInterface';
import { Customer } from '../models/Customer';

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

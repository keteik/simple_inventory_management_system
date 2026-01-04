import { LocationCode } from '../interfaces/CustomerInterface';

// Create Customer Command
export class CreateCustomerCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly location: LocationCode
  ) {}
}

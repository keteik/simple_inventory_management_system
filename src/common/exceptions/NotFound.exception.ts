import { HttpException } from './Http.exception';

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(message, 404);
    this.name = 'NotFoundException';
  }
}

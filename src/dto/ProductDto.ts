import { IProduct } from '../interfaces/ProductInterface';

export class ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;

  constructor(product: IProduct) {
    this.id = product._id.toString();
    this.name = product.name;
    this.description = product.description;
    this.price = product.price;
    this.stock = product.stock;
  }
}

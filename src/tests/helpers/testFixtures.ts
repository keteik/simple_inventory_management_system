import { Customer } from '../../models/customer';
import { Product } from '../../models/product';
import { LocationCode } from '../../interfaces/customerInterface';
import { ProductCategory } from '../../interfaces/productInterface';

/**
 * Create test customers with different location codes
 */
export const createTestCustomers = async () => {
  const usCustomer = await Customer.create({
    email: 'us.customer@test.com',
    name: 'US Test Customer',
    locationCode: LocationCode.US,
  });

  const euCustomer = await Customer.create({
    email: 'eu.customer@test.com',
    name: 'EU Test Customer',
    locationCode: LocationCode.EU,
  });

  const asiaCustomer = await Customer.create({
    email: 'asia.customer@test.com',
    name: 'Asia Test Customer',
    locationCode: LocationCode.ASIA,
  });

  return { usCustomer, euCustomer, asiaCustomer };
};

/**
 * Create test products with various categories and stock levels
 */
export const createTestProducts = async () => {
  const electronicsProduct = await Product.create({
    name: 'Test Laptop',
    description: 'A test laptop product',
    price: 1000,
    stock: 50,
    category: ProductCategory.ELECTRONICS,
  });

  const clothingProduct = await Product.create({
    name: 'Test T-Shirt',
    description: 'A test clothing product',
    price: 50,
    stock: 100,
    category: ProductCategory.CLOTHING,
  });

  const homeProduct = await Product.create({
    name: 'Test Chair',
    description: 'A test home product',
    price: 200,
    stock: 30,
    category: ProductCategory.HOME,
  });

  const lowStockProduct = await Product.create({
    name: 'Limited Edition Item',
    description: 'A limited stock product',
    price: 300,
    stock: 2,
    category: ProductCategory.ELECTRONICS,
  });

  return { electronicsProduct, clothingProduct, homeProduct, lowStockProduct };
};

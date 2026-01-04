import { LocationCode } from '../interfaces/customerInterface';
import { Customer } from '../models/customer';

// Seed data for Customers
const loadCustomersSeedData = async () => {
  const customersSeedData: { email: string; name: string; locationCode: LocationCode }[] = [
    {
      email: 'jan.kowalski@example.com',
      name: 'Jan Kowalski',
      locationCode: LocationCode.EU,
    },
    {
      email: 'adam.nowak@example.com',
      name: 'Adam Nowak',
      locationCode: LocationCode.ASIA,
    },
    {
      email: 'anna.wisniewska@example.com',
      name: 'Anna Wisniewska',
      locationCode: LocationCode.US,
    },
  ];

  for (const customerData of customersSeedData) {
    const existingCustomer = await Customer.findOne({ email: customerData.email });
    if (!existingCustomer) {
      const customer = new Customer(customerData);
      await customer.save();
    }
  }
};

export default async function loadData() {
  await loadCustomersSeedData();
}

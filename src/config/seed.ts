import { Customer } from '../models/Customer';

// Seed data for Customers
const loadCustomersSeedData = async () => {
  const customersSeedData = [
    {
      email: 'jan.kowalski@example.com',
      name: 'Jan Kowalski',
      locationCode: 'EU',
    },
    {
      email: 'adam.nowak@example.com',
      name: 'Adam Nowak',
      locationCode: 'AS',
    },
    {
      email: 'anna.wisniewska@example.com',
      name: 'Anna Wisniewska',
      locationCode: 'US',
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

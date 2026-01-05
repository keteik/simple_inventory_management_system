# Simple Inventory Management System

A Node.js/Express inventory management system implementing CQRS (Command Query Responsibility Segregation) pattern with MongoDB, featuring product stock management, order processing with dynamic pricing, location-based tariffs, and promotional discounts.

## Features

- **CQRS Architecture**: Separate command and query handlers for write and read operations
- **Inventory Management**: Create products, restock inventory, and process sales
- **Dynamic Pricing System**: 
  - Location-based tariffs (US, EU, ASIA regions)
  - Volume discounts (10 or more items)
  - Date-based promotions (Black Friday, Holiday season)
- **Transaction Support**: ACID transactions for order processing and inventory management
- **RESTful API**: Product inventory management and order processing endpoints
- **Input Validation**: Request validation using express-validator
- **Test Coverage**: Unit and integration tests with Jest

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Replica Set (for transaction support)
- **ODM**: Mongoose
- **Testing**: Jest, Supertest, MongoDB Memory Server
- **Validation**: express-validator
- **Code Quality**: ESLint, Prettier

## Prerequisites

- Node.js (v18 or higher recommended)
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cqrs-express-mongodb-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB

Start MongoDB replica set using Docker Compose:

```bash
docker-compose up -d
```

This will start a MongoDB instance configured as a replica set (required for transaction support).

### 4. Configure Environment Variables

Create a `.env` file in the root directory (optional, defaults will be used):

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/inventory-db?replicaSet=rs0
```

### 5. Run the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Build

```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured port) and automatically:
- Connect to MongoDB
- Initialize the replica set
- Seed the database with sample products and customers

## API Endpoints

### Products

- `GET /products` - List all products (with pagination: `?page=1&limit=10`)
- `POST /products` - Create a new product
- `PATCH /products/:id/restock` - Restock product inventory
- `PATCH /products/:id/sell` - Sell product (decrease stock)

#### Example Create Product Request

```json
{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "category": "ELECTRONICS"
}
```

#### Example Restock Request

```json
{
  "stockToIncreaseBy": 20
}
```

#### Example Sell Request

```json
{
  "stockToDecreaseBy": 5
}
```

### Orders

- `POST /orders` - Create a new order (applies pricing rules and updates inventory)

#### Example Order Request

```json
{
  "customerId": "507f1f77bcf86cd799439011",
  "products": [
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 2
    }
  ]
}
```

## Testing

Run the test suite:

```bash
npm test
```

Tests include:
- Unit tests for pricing service and command handlers
- Integration tests for order API with in-memory MongoDB

## Development

### Code Formatting

```bash
npm run format
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Project Structure

```
src/
├── commands/          # Command definitions (write operations)
├── handlers/          # Command and query handlers
├── queries/           # Query definitions (read operations)
├── services/          # Domain services (pricing logic)
├── models/            # Mongoose models
├── routes/            # API route definitions
├── dto/               # Data Transfer Objects
├── validators/        # Input validation schemas
├── middleware/        # Express middleware
├── exceptions/        # Custom exceptions
├── interfaces/        # TypeScript interfaces
└── tests/             # Unit and integration tests
```

## Architecture Notes

This project implements the CQRS pattern with:
- **Commands**: Handle write operations (create/update/delete)
- **Queries**: Handle read operations (list/get)
- **Handlers**: Contain business logic for commands and queries
- **Services**: Encapsulate complex domain logic (e.g., pricing calculations)

For detailed implementation notes, design decisions, and assumptions, see [NOTES.md](NOTES.md).

## Pricing Logic

The system calculates prices in the following order:

1. **Base Price**: Product price
2. **Location Tariff**: Applied based on customer location
   - US: 0% (no tariff)
   - EU: 15% tariff
   - ASIA: 20% tariff
3. **Discounts**: Applied to tariff-adjusted price (best discount wins)
   - Volume discount: 10% off for orders with 10+ items
   - Black Friday: 25% off (Nov 24-30)
   - Holiday discount: 15% off for electronics/clothing (Dec 20-26)

## License

MIT

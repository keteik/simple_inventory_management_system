# Node.js Express MongoDB TypeScript CQRS Template

A production-ready template for building scalable REST APIs using Node.js, Express, MongoDB, TypeScript, and the CQRS (Command Query Responsibility Segregation) pattern.

## Features

- ✅ **TypeScript** - Full type safety
- ✅ **Express.js** - Fast, minimalist web framework
- ✅ **MongoDB** - NoSQL database with Mongoose ODM
- ✅ **CQRS Pattern** - Separation of commands and queries
- ✅ **Request Validation** - Using Zod for schema validation
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Security** - Helmet for security headers
- ✅ **CORS** - Cross-Origin Resource Sharing enabled
- ✅ **Logging** - Morgan for HTTP request logging
- ✅ **Docker** - MongoDB containerization with docker-compose
- ✅ **ESLint & Prettier** - Code quality and formatting

## Project Structure

```
├── src/
│   ├── commands/           # Command definitions (write operations)
│   │   └── UserCommands.ts
│   ├── queries/            # Query definitions (read operations)
│   │   └── UserQueries.ts
│   ├── handlers/           # Command and Query handlers
│   │   ├── UserCommandHandlers.ts
│   │   └── UserQueryHandlers.ts
│   ├── models/             # Mongoose models
│   │   └── User.ts
│   ├── routes/             # Express routes
│   │   └── userRoutes.ts
│   ├── middleware/         # Custom middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── validators/         # Request validators
│   │   └── userValidators.ts
│   ├── config/             # Configuration files
│   │   └── database.ts
│   └── index.ts            # Application entry point
├── dist/                   # Compiled JavaScript (generated)
├── docker-compose.yml      # Docker configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variables template
```

## CQRS Pattern Implementation

This template implements the CQRS pattern to separate read and write operations:

### Commands (Write Operations)
- **CreateUserCommand** - Create a new user
- **UpdateUserCommand** - Update existing user
- **DeleteUserCommand** - Delete a user

### Queries (Read Operations)
- **GetUserByIdQuery** - Fetch user by ID
- **GetUserByEmailQuery** - Fetch user by email
- **GetAllUsersQuery** - Fetch all users with pagination

### Handlers
- **Command Handlers** - Execute commands and modify state
- **Query Handlers** - Execute queries and return data

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (optional, for MongoDB)
- MongoDB (if not using Docker)

## Getting Started

### 1. Clone and Setup

```bash
# Copy environment variables
cp .env.example .env

# Install dependencies
npm install
```

### 2. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local MongoDB**
Make sure MongoDB is running on `mongodb://localhost:27017`

### 3. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
```bash
GET /health
```

### Users API

#### Create User
```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30
}
```

#### Get All Users
```bash
GET /api/users?page=1&limit=10
```

#### Get User by ID
```bash
GET /api/users/:id
```

#### Update User
```bash
PUT /api/users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "age": 31
}
```

#### Delete User
```bash
DELETE /api/users/:id
```

## Example Usage with cURL

```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","age":25}'

# Get all users
curl http://localhost:3000/api/users

# Get user by ID (replace with actual ID)
curl http://localhost:3000/api/users/507f1f77bcf86cd799439011

# Update user
curl -X PUT http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/507f1f77bcf86cd799439011
```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cqrs-app
```

## CQRS Benefits

1. **Separation of Concerns** - Read and write operations are handled separately
2. **Scalability** - Scale read and write operations independently
3. **Flexibility** - Different models for reading and writing
4. **Optimization** - Optimize queries and commands separately
5. **Maintainability** - Clearer code organization

## Adding New Features

### 1. Create Commands/Queries

```typescript
// commands/ProductCommands.ts
export class CreateProductCommand {
  constructor(
    public readonly name: string,
    public readonly price: number
  ) {}
}
```

### 2. Create Handlers

```typescript
// handlers/ProductCommandHandlers.ts
export class CreateProductCommandHandler {
  async handle(command: CreateProductCommand) {
    // Implementation
  }
}
```

### 3. Create Routes

```typescript
// routes/productRoutes.ts
router.post('/', async (req, res) => {
  const command = new CreateProductCommand(req.body.name, req.body.price);
  const result = await handler.handle(command);
  res.json(result);
});
```

## Best Practices

- Keep commands and queries simple and focused
- Handlers should contain business logic
- Use validation middleware for all inputs
- Follow TypeScript strict mode
- Write meaningful error messages
- Use proper HTTP status codes

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

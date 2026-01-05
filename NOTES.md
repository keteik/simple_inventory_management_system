# Implementation Notes

## 1. Assumptions & Simplifications

### 1.1 Key Assumptions

- **Customer Model Simplification**: Customers are represented with only essential fields (name, email, locationCode). In a production system, this would include address details, contact information, payment methods, order history, and customer preferences.

- **Location-Based Pricing**: Location codes (US, EU, ASIA) are assumed to be sufficient for regional pricing. Real-world implementations would require more granular location data (country, state/province, city) for accurate tax and shipping calculations.

- **Date-Based Discounts**: The system assumes that promotional dates are predefined in code. In production, these would be stored in a database with management UI for marketing teams to create and modify campaigns dynamically.

- **Stock Management**: Stock is managed at a simple numerical level without concepts like:
  - Reserved stock (items in carts or pending orders)
  - Warehouse locations

### 1.2 Intentionally Omitted Elements

- **Audit Logging**: Limited to database timestamps. Production would need comprehensive audit trails for compliance and debugging.

- **Rate Limiting**: No throttling or rate limiting to prevent abuse.

- **Caching**: No caching layer (Redis, etc.) for frequently accessed data.

- **Event Sourcing**: While CQRS is implemented, full event sourcing was omitted. Commands modify state directly rather than generating events.

- **Advanced Validation**: Basic validation is implemented, but production would need:
  - Email verification
  - Address validation
  - Fraud detection
  - Business rules validation

- **Monitoring & Observability**: No APM, distributed tracing, or comprehensive metrics collection.

- **Soft Deletes**: Products and customers use hard deletes. Production systems typically use soft deletes to maintain referential integrity.

### 1.3 Interpretation of Ambiguous Requirements

**Discount Rule Priority**:
- Interpreted that only ONE discount can be applied per order (the best one)
- Among multiple applicable discounts, the one providing the highest absolute savings is selected
- Black Friday (25%) has implicit priority over Holiday discounts (15%) when dates overlap

**Location Pricing vs Discounts**:
- Location tariffs are applied BEFORE discounts
- Base price = product price × location tariff rate
- Discounts are then applied to the tariff-adjusted base price
- This means EU customers with 15% tariff can still get volume/date discounts on the tariffed price

**Stock Consistency**:
- Stock must be non-negative (min: 0 constraint)
- Orders must fully succeed or fully fail (transaction boundary)
- Optimistic locking is used via MongoDB's conditional updates (`stock: { $gte: quantity }`)
- Double-checking in transaction ensures race condition safety

**Product Categories and Holiday Discounts**:
- Holiday discounts apply only to ELECTRONICS and CLOTHING categories
- If an order contains mixed categories, discount applies only to eligible items
- The discount rate is applied per-item, not to the total

## 2. Technical Decisions

### 2.1 Database Choice: MongoDB with Replica Set

**Reasoning**:
- **Transaction Support**: MongoDB (v4.0+) with replica sets supports multi-document ACID transactions, essential for order processing where stock updates and order creation must be atomic.
  
- **Schema Flexibility**: Document model allows for flexible product attributes and easy schema evolution without migrations. This is particularly useful for e-commerce where product schemas can vary significantly.

- **Embedded Documents**: Natural fit for order structure with embedded product arrays, avoiding joins and improving read performance.

- **Developer Experience**: Mongoose provides elegant ODM with TypeScript support, validation, and middleware hooks.

**Trade-offs**:
- Requires replica set even in development (adds setup complexity)
- No native enforcement of referential integrity (handled at application layer)

**Alternative Considered**: LowDB
- Simple JSON file-based database, perfect for prototyping and small-scale applications
- Zero configuration and no external dependencies
- However, lacks transaction support, concurrent access handling, and scalability
- Chosen MongoDB for ACID transaction guarantees essential for inventory management and production-grade data consistency

### 2.2 Project Structure

**Layered Architecture with Clear Separation of Concerns**:

```
src/
├── commands/          # Command definitions (write operations)
├── queries/           # Query definitions (read operations)
├── handlers/          # Command and Query handlers (business logic)
├── services/          # Domain services (PricingService)
├── models/            # Mongoose models (data layer)
├── dto/               # Data Transfer Objects (API contracts)
├── validators/        # Input validation schemas
├── middleware/        # Express middleware (error handling, validation)
├── routes/            # API endpoints routing
├── exceptions/        # Custom exception classes
└── interfaces/        # TypeScript interfaces
```

**Key Design Principles**:

1. **Dependency Inversion**: Handlers depend on interfaces, not concrete implementations
2. **Single Responsibility**: Each module has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Shared validation, error handling, and utilities are centralized
4. **Explicit over Implicit**: Clear naming conventions and type safety throughout

**Why This Structure**:
- **Maintainability**: Clear boundaries make it easy to locate and modify code
- **Testability**: Isolated layers can be tested independently
- **Scalability**: New features can be added without modifying existing structure
- **Onboarding**: New developers can quickly understand the application flow

### 2.3 CQRS Implementation Approach

**Simplified CQRS** (Command Query Responsibility Segregation):

**Command Side** (Writes):
```typescript
Command → CommandHandler → Service/Repository → Database
```
- Commands represent write intentions (CreateOrderCommand, CreateProductCommand)
- Handlers contain business logic and orchestration
- Services provide domain-specific operations (PricingService)

**Query Side** (Reads):
```typescript
Query → QueryHandler → Repository → Database
```
- Queries represent read intentions (GetProductsQuery, GetProductByIdQuery)
- Handlers retrieve and transform data into DTOs
- Optimized for read performance with pagination

**Why This Approach**:
- **Separation of Concerns**: Write logic (validation, business rules) is separated from read logic (data retrieval, formatting)
- **Scalability**: Read and write sides can be optimized independently
- **Clarity**: Intent is clear from command/query names
- **Testing**: Easier to test write logic separately from read logic

**What's Missing for Full CQRS**:
- Separate read/write databases (using same MongoDB instance)
- Event store (commands modify state directly)
- Eventual consistency handling (operations are synchronous)
- Read models optimized for specific queries

**Why Simplified**:
- Appropriate for the application's current scale
- Reduces complexity while maintaining benefits
- Easy to evolve into full CQRS if needed
- Balances pattern benefits with pragmatism

### 2.4 Command/Query Separation Explanation

**Commands** (src/commands/):
- Represent user intentions to change system state
- Example: `CreateOrderCommand`, `CreateProductCommand`
- Validated before reaching handlers
- Execute within transactions when needed
- Return meaningful results (created entity DTOs)

**Queries** (src/queries/):
- Represent requests for data without side effects
- Example: `GetProductsQuery`, `GetProductByIdQuery`
- Support filtering, pagination, sorting
- Can be cached (though not implemented in this version)
- Return DTOs for consistent API contracts

**Benefits Realized**:
1. **Code Organization**: Clear separation makes codebase navigable
2. **Performance Optimization**: Queries can be optimized for reads without affecting write logic
3. **Security**: Different validation rules for reads vs writes
4. **Flexibility**: Can evolve read/write sides independently

## 3. Business Logic

### 3.1 Discount System

**Discount Types**:
1. **Volume Discounts**: Based on total items in order
   - 5-9 items: 10% off
   - 10-49 items: 20% off
   - 50+ items: 30% off

2. **Date-Based Discounts**:
   - **Black Friday** (25% off all products): November 29, 2025
   - **Holiday Discounts** (15% off selected categories): Multiple dates throughout the year
     - Categories: ELECTRONICS, CLOTHING only

**Priority and Application Order**:

1. **Location Tariff Applied First**:
   ```
   unitBasePrice = productPrice × locationTariffRate
   basePrice = sum(unitBasePrice × quantity for all items)
   ```

2. **Discount Selection** (only one discount is applied):
   - Calculate potential savings from volume discount
   - Calculate potential savings from date-based discount
   - Select the discount with the **highest absolute savings** (not highest percentage)
   - Special rule: Black Friday takes precedence over Holiday discount when both apply

3. **Discount Application**:
   ```
   discountAmount = basePrice × discountRate (or partial for category-specific)
   finalPrice = basePrice - discountAmount
   ```

**Edge Cases Handled**:

- **Mixed Categories on Holiday**: Only eligible category items receive the discount
  ```typescript
  // Example: Order on holiday with electronics + food
  // Electronics: gets 15% off
  // Food: no discount
  // Total discount: 15% of electronics subtotal only
  ```

- **Multiple Discount Eligibility**: Customer qualifies for both volume AND date discount
  ```typescript
  // System calculates savings from each
  // Applies the one with higher absolute value
  // Example: $500 order, 50 items
  //   - Volume: 30% = $150 savings
  //   - Holiday: 15% = $75 savings
  //   - Applied: Volume (higher savings)
  ```

- **Location Tariff + Discount Interaction**:
  ```typescript
  // EU customer (15% tariff), Black Friday (25% discount)
  // Product: $100
  // Base after tariff: $115
  // Discount on tariffed price: $115 × 0.25 = $28.75
  // Final: $86.25
  ```

- **Fractional Quantities**: Prevented by schema validation (quantities are floored to integers)

- **Zero or Negative Prices**: Prevented by schema validation (min: 0 constraints)

### 3.2 Stock Consistency Mechanisms

**Multi-Layered Protection**:

1. **Schema-Level Validation**:
   ```typescript
   stock: {
     type: Number,
     required: true,
     min: 0,  // Prevents negative stock at model level
     set: (v: number) => Math.floor(v)  // Ensures integer values
   }
   ```

2. **Pre-Transaction Validation**:
   ```typescript
   // Before transaction starts, verify stock availability
   if (product.stock < orderProduct.quantity) {
     throw new BadRequestException('Insufficient stock');
   }
   ```

3. **Atomic Updates with Conditional Checks**:
   ```typescript
   await Product.bulkWrite([{
     updateOne: {
       filter: {
         _id: productId,
         stock: { $gte: quantity }  // Only update if stock is sufficient
       },
       update: { $inc: { stock: -quantity } }
     }
   }], { session });
   
   // Verify all updates succeeded
   if (result.matchedCount !== expectedCount) {
     throw new BadRequestException('Stock changed during order processing');
   }
   ```

4. **Transaction Boundary**:
   ```typescript
   // All operations within single transaction
   // If any step fails, entire order is rolled back
   session.withTransaction(async () => {
     // 1. Verify customer
     // 2. Verify products
     // 3. Calculate pricing
     // 4. Update stock (atomic)
     // 5. Create order
   });
   ```

**Race Condition Prevention**:

**Scenario**: Two simultaneous orders for the last item in stock

1. **Order A** reads stock: 1 unit available
2. **Order B** reads stock: 1 unit available
3. **Order A** attempts update with condition `stock >= 1`: **SUCCEEDS**
4. **Order B** attempts update with condition `stock >= 1`: **FAILS** (stock now 0)
5. **Order B** transaction rolls back with error

The conditional update (`stock: { $gte: quantity }`) in step 3 of the atomic update ensures that only the first transaction to execute the update succeeds.

**Why This Approach**:
- **Optimistic Locking**: Assumes conflicts are rare, checks at commit time
- **Better Performance**: No explicit locks, higher concurrency
- **Automatic Rollback**: Transaction handles cleanup on failure
- **Database-Level Guarantee**: MongoDB ensures atomicity

### 3.3 Key Edge Cases

1. **Customer Not Found**: Validated at start of order transaction, fails fast with clear error

2. **Product Not Found**: Each product in order is verified to exist before processing

3. **Partial Stock Availability**: Order fails entirely if ANY product has insufficient stock (no partial fulfillment)

4. **Concurrent Stock Updates**: Handled via atomic conditional updates as described above

5. **Invalid Quantities**: 
   - Zero or negative: Rejected by validation middleware
   - Decimals: Automatically floored to integers

6. **Empty Orders**: Rejected by validation (must have at least one product)

7. **Duplicate Products in Order**: Allowed; quantities are summed per product

8. **Price Changes During Order**: Product price at order time is captured in order document (immutable record)

9. **Customer Location Changes**: Order uses location at order time (captured in pricing calculation)

10. **Date Boundary Issues**: Date discounts use ISO date format (YYYY-MM-DD), compared to server date (UTC)

11. **Floating Point Precision**: 
    - Prices stored with 2 decimal places (cents)
    - Calculations use `decimal.js` library for precise arithmetic
    - Prevents rounding errors in monetary calculations

12. **Transaction Timeout**: MongoDB transactions have default timeout; long-running orders may fail (not customized in this implementation)

## 4. Testing

### 4.1 Test Coverage

**Unit Tests** (`src/tests/unit/`):

1. **PricingService Tests** (`pricingService.test.ts`):
   - ✅ Location tariff calculations (US, EU, ASIA)
   - ✅ Volume discount tiers (5, 10, 50 items)
   - ✅ Date-based discounts (Black Friday, Holiday)
   - ✅ Holiday discount category filtering
   - ✅ Best discount selection logic
   - ✅ Mixed scenarios (location + volume, location + date)
   - ✅ Edge cases (no discount, high volume, category exclusions)

2. **OrderCommandHandler Tests** (`orderCommandHandler.test.ts`):
   - ✅ Successful order creation
   - ✅ Stock deduction
   - ✅ Customer validation
   - ✅ Product validation
   - ✅ Insufficient stock handling
   - ✅ Transaction rollback on failure

**Integration Tests** (`src/tests/integration/`):

1. **Order API Tests** (`orderApi.test.ts`):
   - ✅ End-to-end order creation flow
   - ✅ Single and multiple product orders
   - ✅ Stock consistency across concurrent requests
   - ✅ Location-based pricing in real orders
   - ✅ Volume discount application
   - ✅ Date discount application (mocked dates)
   - ✅ Error responses (404, 400)
   - ✅ Validation errors
   - ✅ Stock depletion scenarios

**Testing Infrastructure**:
- **mongodb-memory-server**: In-memory MongoDB for isolated tests
- **Supertest**: HTTP request testing
- **Jest**: Test framework with mocking capabilities
- **Test Fixtures**: Reusable test data creators

**Why These Areas**:
1. **Pricing Logic**: Most complex business logic, critical for revenue accuracy
2. **Order Processing**: Core business flow, involves transactions and data integrity
3. **API Contracts**: Ensures external interface stability
4. **Stock Management**: Critical for data consistency

### 4.2 Production Requirements Not Covered

**1. Performance Testing**:
- Load testing (high concurrent order volume)
- Stress testing (system behavior under extreme load)
- Database query optimization validation
- Response time benchmarks under load
- Memory leak detection over extended periods

**2. Security Testing**:
- SQL/NoSQL injection attempts
- CORS policy validation

**3. End-to-End Testing**:
- Complete user journey flows
- Multi-step workflows (browse → cart → checkout → confirmation)
- Error recovery scenarios
- UI interaction testing (no UI in this project)

**4. Chaos Engineering**:
- Database failure scenarios
- Network partition handling
- Service degradation tests
- Backup and recovery procedures
- Replica set failover testing

**5. Data Integrity Testing**:
- Long-running transaction scenarios
- Database corruption recovery
- Backup integrity validation
- Migration testing (schema evolution)

**6. Monitoring and Observability Testing**:
- Logging completeness and accuracy
- Metrics collection validation
- Alert triggering conditions
- Distributed tracing (if implemented)

**7. Database Migration Testing**:
- Schema migration rollback procedures
- Data migration validation
- Zero-downtime deployment testing

---

## 5. Trade-offs & Alternatives

### Design Decision: Hardcoded Discount Rules in PricingService

**Current Implementation** ([src/services/pricingService.ts](src/services/pricingService.ts)):
```typescript
private readonly VOLUME_DISCOUNTS: IVolumeDiscountRule[] = [
  { minItems: 50, rate: 0.3, type: DiscountType.VOLUME, ... },
  { minItems: 10, rate: 0.2, type: DiscountType.VOLUME, ... },
  { minItems: 5, rate: 0.1, type: DiscountType.VOLUME, ... },
];

private readonly DATE_DISCOUNTS: IDateDiscountRule[] = [
  { type: DiscountType.BLACK_FRIDAY, rate: 0.25, dates: ['2025-11-29'], ... },
  { type: DiscountType.HOLIDAY, rate: 0.15, dates: [...], ... },
];
```

**What I Would Change with More Time:**
Move discount rules to a database collection with a management API/admin interface. Marketing teams could then create, modify, and schedule promotions without requiring code deployments.

**Alternative Considered:**
Database-driven discount system with a `DiscountRules` collection storing:
- Rule types (volume, date-based, category-specific, customer-segment)
- Activation dates and durations
- Priority levels
- Eligibility criteria
- Stacking permissions

Implementation would involve:
```typescript
// Hypothetical structure
class DiscountRule {
  type: string;
  conditions: { minItems?: number; dates?: string[]; categories?: string[] };
  discount: { rate: number; maxAmount?: number };
  priority: number;
  active: boolean;
  validFrom: Date;
  validTo: Date;
}
```

**Why Database Approach Was Rejected:**

1. **Time Constraints**: Building a complete discount management system would require:
   - Database schema design and validation
   - Complex query logic to fetch applicable rules
   - Migration of existing rules to database
   - Additional test coverage for dynamic rule loading

2. **Scope Creep**: The core requirement was demonstrating CQRS pattern and transaction handling, not building a CMS for marketing campaigns

3. **Testing Complexity**: Static rules in code are:
   - Easier to mock in tests
   - Version-controlled with the code
   - Immutable during test execution
   - Type-safe at compile time

**Why Hardcoded Approach Was Selected:**

1. **Type Safety**: TypeScript interfaces enforce rule structure at compile time
   ```typescript
   // Compile error if structure is wrong
   const rule: IVolumeDiscountRule = { /* must match interface */ };
   ```

2. **Predictability**: Rules can't change unexpectedly during execution or between deployments

3. **Simplicity**: Zero database queries for discount logic = faster execution, no caching needed

4. **Development Speed**: Could implement and test full pricing logic in less time

**Real Downsides of Chosen Solution:**

1. **Deployment Required for Changes**: Marketing team running a flash sale at 3 PM needs:
   - Developer to update dates in code
   - Code commit and review
   - CI/CD pipeline execution
   - Server restart
   - Typical deployment cycle: 15-30 minutes minimum
   - With database: 30 seconds via admin panel

2. **No Runtime Flexibility**: Cannot:
   - A/B test discount rates
   - Schedule promotions in advance via UI
   - Deactivate broken promotion immediately
   - Personalize discounts per customer segment
   - Create time-limited flash sales dynamically

3. **Business Team Dependency**: Non-technical staff cannot manage promotions independently, creating bottleneck

4. **Audit Trail**: Changes visible only in Git history, not in application logs

5. **Scalability Limit**: Adding 50 holiday dates requires 50 hardcoded strings; database would handle this elegantly with date ranges

**Specific File Impact:**
- [src/services/pricingService.ts](src/services/pricingService.ts) (lines 14-74): 60+ lines of static configuration that could be 10 lines of database queries
- [src/interfaces/pricingInterface.ts](src/interfaces/pricingInterface.ts): Interface definitions would need expansion for dynamic rules
- [tests/unit/pricingService.test.ts](tests/unit/pricingService.test.ts): Would require database mocking instead of simple in-memory tests

**Compromise Assessment:**
For a recruitment task or MVP, this was the correct choice. For a production system with active marketing campaigns, this would be technical debt requiring immediate addressing. The break-even point is approximately "third time marketing asks to change discount rules" - at that point, database migration pays for itself in time saved.

---

## Summary

This implementation provides a solid foundation for an e-commerce order processing system using CQRS principles and MongoDB transactions. The design prioritizes:

- **Correctness**: Transaction guarantees for data consistency
- **Clarity**: Clear separation between commands and queries
- **Maintainability**: Modular structure with explicit dependencies
- **Testability**: Comprehensive test coverage of business logic

The simplified approach trades some advanced features (event sourcing, read/write database separation) for reduced complexity while maintaining the core benefits of the CQRS pattern. The system is production-ready for MVP deployment but would require additional hardening (authentication, monitoring, caching, etc.) for large-scale production use.

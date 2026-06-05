# GestaoOS PostgreSQL Database Guide

This document describes the PostgreSQL database infrastructure for the GestaoOS Application. Our architecture uses Prisma ORM to guarantee type safety and automated migrations.

## Environment Config

The application respects the following env variables to locate and configure the database:
- `DATABASE_URL`: Primary connection for production / development (used by API and `db:deploy`).
- `DATABASE_URL_TEST`: Secondary database used strictly for database integration tests (`npm run test:db`).

If `DATABASE_URL` is omitted, the `check-env.ts` script will warn you (or fail in production) and the backend APIs might crash if actually invoked, while the frontend may fallback to `mock` mode in local development.

## Local Test Environment (Docker)

To run tests with a real database efficiently locally, use Docker. Our `docker-compose.yml` provides a setup natively configured for GestaoOS.

1. **Spin up Local Postgres Database**:
   ```bash
   npm run db:up
   ```
   This spins up the `db` service on port `5432` with username `user` and password `password`. It also automatically invokes `docker/initdb/01-init-test-db.sh` to create the `gestaoos_test` database alongside `gestaoos`.

2. **Wait for the Database to Bootstrap**:
   ```bash
   npm run db:wait
   ```

3. **Configure Environment Variables**:
   In your `.env` or during the command line, apply:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/gestaoos?schema=public"
   DATABASE_URL_TEST="postgresql://user:password@localhost:5432/gestaoos_test?schema=public"
   ```

4. **Initialize DB**:
   ```bash
   npm run db:setup:dev
   npm run db:setup:test
   ```
   *Note: If there are no migrations present (`prisma/migrations` folder doesn't exist), you must create the initial migration by running: `npx prisma migrate dev --name init`.*

5. **Run the DB Tests**:
   ```bash
   npm run test:db
   ```
   If these variables are correctly set, `test:db` will stop skipping and will successfully validate your data integrity rules (ACID, Uniqueness) directly on PostgreSQL.

## Prisma Setup

The schema is defined in `prisma/schema.prisma`. It represents the single source of truth for the RDBMS.

### Notable Architecture Points:
1. **Multi-Tenancy**: All primary entities have a `tenantId`. Unique constraints are often composite like `@@unique([tenantId, X])` to safely isolate SaaS tenants.
2. **ACID compliance**: Features like Inventory movements (`StockMovement`) run via `prisma.$transaction` across tables to avoid race conditions.
3. **Idempotency**: `PaymentWebhookEvent`, `Order.trackingNumber`, and `FinancialTransaction.referenceId` combine with `tenantId` to enforce idempotency when processing webhooks.

## Commands

### Migrations
- `npm run db:migrate` - Use this during development if you changed `schema.prisma`. It generates SQL instructions and applies them.
- `npm run db:deploy` - Use this during deployment to CI/CD or production. It safely applies pending migrations without attempting to generate new ones.

### Seeds
- `npm run db:seed` - Evaluates current rows and creates necessary onboarding data. It is highly idempotent and does not break existing tenants. If `NO_SEED` is passed or it detects records, it safely jumps default setups.

## Managing your Database

If you wish to visualize your schema or inspect the PostgreSQL database, use:
```bash
npm run db:studio
```
This will launch a GUI in your default browser at `http://localhost:5555`.

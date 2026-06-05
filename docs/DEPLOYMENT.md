# GestaoOS Deployment Guide

This document outlines the steps required to provision and deploy GestaoOS with a real PostgreSQL database, without depending on the frontend mock fallback.

## 1. Prepare Environment Variables

You must set up the runtime environment variables before starting the application. Use `.env.example` as a template.

### Critical Variables:
- `NODE_ENV`: Must be `production` for security features to activate.
- `DATA_MODE`: Set to `api` (disables the frontend mock fallback).
- `DATABASE_URL`: Connection string to your PostgreSQL instance.
- `JWT_SECRET`: A long, unguessable string (>32 characters) for authentication.
- `PAYMENTS_ENCRYPTION_KEY`: A string (>16 characters) used to secure idempotency keys.
- `PUBLIC_APP_URL` or `APP_PUBLIC_URL`: The fully qualified public URL (e.g., `https://meusistema.com`).

### Optional Integrations:
- **Mercado Pago**: Fill `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, and `MP_WEBHOOK_SECRET` to enable full checkout. Otherwise, it will fallback to "Manual PIX".

## 2. Infrastructure (PostgreSQL)

You can run PostgreSQL locally for development using docker:
```bash
docker run --name gestaoos-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_USER=user -e POSTGRES_DB=gestaoos -p 5432:5432 -d postgres:latest
```

## 3. Database Initialization

Run the following commands to apply your schema and seed initial data.

1. **Verify Environment Constraints**:
   ```bash
   npm run check:env
   ```
2. **Apply Migrations** (creates tables and constraints):
   ```bash
   npm run db:deploy 
   ```
   *Note: If you change `schema.prisma` in dev, you should use `npm run db:migrate` which generates new migration files.*
3. **Seed Database** (creates roles, permissions, admin user layout):
   ```bash
   npm run db:seed
   ```

## 4. Validation

To ensure everything is connected and ready:
```bash
npm run verify
```
This runs typechecks, integration tests, and database tests (if `DATABASE_URL_TEST` is present). 

## 5. Startup & Checklist

Start the build process and boot the application:
```bash
npm run build
npm start
```

**Post-Deploy Verification Checklist:**
- [ ] Connect to `/api/system/health` and verify database shows 'connected'.
- [ ] Login using the admin credentials created in the seed.
- [ ] Create a "Branch/Unidade" in Settings if not created by seed.
- [ ] Test creating an order -> verifies ACID transactions are working with Stock movements.
- [ ] Check MP integration (or manual PIX fallback).

If the UI ever shows an "Offline" or "Mock" warning, double check your `DATA_MODE` and backend database connection.

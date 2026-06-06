import dns from 'dns/promises';

const isProduction = process.env.NODE_ENV === 'production';
const isDev = !isProduction;

let errors: string[] = [];
let warnings: string[] = [];

console.log(`[check-env] Validating target environment constraints: NODE_ENV=${process.env.NODE_ENV}`);

// Helper
const check = (condition: boolean, msg: string, isError = true) => {
    if (!condition) {
        if (isError) errors.push(msg);
        else warnings.push(msg);
    }
};

// 1. JWT_SECRET
const jwtSecret = process.env.JWT_SECRET || '';
check(jwtSecret.length >= 16, 'JWT_SECRET must be at least 16 characters long.', false);

// 2. DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    check(false, 'DATABASE_URL is missing. The system will rely on mock data or fail for DB-required operations.', false);
}

// 3. DATABASE_URL_TEST
const dbUrlTest = process.env.DATABASE_URL_TEST;
if (!dbUrlTest) {
    check(false, 'DATABASE_URL_TEST is missing. Database integration tests (test:db) will be skipped.', false);
}

// 4. Payments
const paymentsKey = process.env.PAYMENTS_ENCRYPTION_KEY || '';
if (!paymentsKey) {
    check(false, 'PAYMENTS_ENCRYPTION_KEY is missing. Payment webhooks validation may be degraded.', false);
} else {
    check(paymentsKey.length >= 16, 'PAYMENTS_ENCRYPTION_KEY must be at least 16 characters long.', false);
}

// 5. Mercado Pago
const mpClientId = process.env.MP_CLIENT_ID;
const mpClientSecret = process.env.MP_CLIENT_SECRET;
const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET;

const mpCount = [mpClientId, mpClientSecret, mpWebhookSecret].filter(Boolean).length;
if (mpCount > 0 && mpCount < 3) {
    check(false, 'Mercado Pago variables (MP_CLIENT_ID, MP_CLIENT_SECRET, MP_WEBHOOK_SECRET) are partially configured.', false);
} else if (mpCount === 0) {
    check(false, 'Mercado Pago variables are missing. Checkout will fallback to Manual PIX.', false);
}

// 6. PUBLIC_APP_URL
if (!process.env.PUBLIC_APP_URL && !process.env.APP_PUBLIC_URL) {
    check(false, 'PUBLIC_APP_URL or APP_PUBLIC_URL is missing. Webhooks and internal links may fail.', false);
}

// 7. PORT
if (!process.env.PORT) {
    check(false, 'PORT is missing (defaulting to 3000).', false);
}

if (warnings.length > 0) {
    console.log('\n[check-env] Warnings:');
    warnings.forEach(w => console.log(`  ⚠️ ${w}`));
}

if (errors.length > 0) {
    console.error('\n[check-env] Validation Errors:');
    errors.forEach(e => console.error(`  ❌ ${e}`));
    console.error('\nEnvironment validation failed.');
    process.exit(1);
}

console.log('\n✅ Environment validation passed.\n');
process.exit(0);

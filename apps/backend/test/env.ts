// Loaded by Jest before any test file. Values are set unconditionally so a
// test run can never reach the development database or a real Stripe key.
process.env.DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	'postgresql://shop:shop@localhost:5434/stripe_payments_test'
process.env.STRIPE_SECRET_KEY = 'sk_test_offline'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
process.env.FRONTEND_ORIGIN = 'http://localhost:4000'
process.env.RECONCILE_AFTER_SECONDS = '0'
process.env.RECONCILE_INTERVAL_SECONDS = '0'

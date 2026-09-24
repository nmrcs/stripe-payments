import { z } from 'zod'

const envSchema = z.object({
	DATABASE_URL: z
		.string()
		.url()
		.regex(/^postgres(ql)?:\/\//),
	PORT: z.coerce.number().default(4001),
	FRONTEND_ORIGIN: z.string().url().default('http://localhost:4000'),
	// This repository only ever talks to a Stripe sandbox.
	STRIPE_SECRET_KEY: z.string().startsWith('sk_test_', {
		message: 'STRIPE_SECRET_KEY must be a sandbox key (sk_test_...)',
	}),
	STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
	RECONCILE_AFTER_SECONDS: z.coerce.number().int().min(0).default(120),
	RECONCILE_INTERVAL_SECONDS: z.coerce.number().int().min(0).default(60),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
	return envSchema.parse(config)
}

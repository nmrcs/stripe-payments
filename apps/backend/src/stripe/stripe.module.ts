import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import type { Env } from '../config/env'

// Injection token for the Stripe client. Tests replace the provider and stub
// the calls that would go to the network.
export const STRIPE = Symbol('STRIPE')

@Global()
@Module({
	providers: [
		{
			provide: STRIPE,
			inject: [ConfigService],
			useFactory: (config: ConfigService<Env, true>) =>
				new Stripe(config.get('STRIPE_SECRET_KEY', { infer: true })),
		},
	],
	exports: [STRIPE],
})
export class StripeModule {}

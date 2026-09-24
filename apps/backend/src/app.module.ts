import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CheckoutModule } from './checkout/checkout.module'
import { validateEnv } from './config/env'
import { HealthController } from './health/health.controller'
import { OrdersModule } from './orders/orders.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProductsModule } from './products/products.module'
import { StripeModule } from './stripe/stripe.module'
import { WebhooksModule } from './webhooks/webhooks.module'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
		PrismaModule,
		StripeModule,
		ProductsModule,
		OrdersModule,
		CheckoutModule,
		WebhooksModule,
	],
	controllers: [HealthController],
})
export class AppModule {}

import {
	BadGatewayException,
	BadRequestException,
	Inject,
	Injectable,
	Logger,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type {
	CheckoutRequest,
	CheckoutResponse,
} from '@stripe-payments/contracts'
import type Stripe from 'stripe'
import type { Env } from '../config/env'
import { OrdersService } from '../orders/orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { STRIPE } from '../stripe/stripe.module'

// A minute above Stripe's 30-minute minimum, so clock drift between this
// server and Stripe cannot push the value below it.
const CHECKOUT_TTL_SECONDS = 31 * 60

@Injectable()
export class CheckoutService {
	private readonly logger = new Logger(CheckoutService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly orders: OrdersService,
		private readonly config: ConfigService<Env, true>,
		@Inject(STRIPE) private readonly stripe: Stripe,
	) {}

	async create(request: CheckoutRequest): Promise<CheckoutResponse> {
		const ids = request.items.map((i) => i.productId)
		const products = await this.prisma.product.findMany({
			where: { id: { in: ids } },
		})
		if (products.length !== ids.length) {
			throw new BadRequestException('unknown product')
		}
		const currency = products[0].currency
		if (products.some((p) => p.currency !== currency)) {
			throw new BadRequestException('one currency per order')
		}

		const lines = request.items.map((item) => {
			const product = products.find((p) => p.id === item.productId)!
			return { product, quantity: item.quantity }
		})
		const totalCents = lines.reduce(
			(sum, l) => sum + l.product.priceCents * l.quantity,
			0,
		)

		const order = await this.prisma.order.create({
			data: {
				totalCents,
				currency,
				items: {
					create: lines.map((l) => ({
						productId: l.product.id,
						quantity: l.quantity,
						unitPriceCents: l.product.priceCents,
					})),
				},
			},
		})

		const frontend = this.config.get('FRONTEND_ORIGIN', { infer: true })
		let session: Stripe.Checkout.Session
		try {
			session = await this.stripe.checkout.sessions.create(
				{
					mode: 'payment',
					line_items: lines.map((l) => ({
						quantity: l.quantity,
						price_data: {
							currency,
							unit_amount: l.product.priceCents,
							product_data: { name: l.product.name },
						},
					})),
					client_reference_id: order.id,
					metadata: { orderId: order.id },
					success_url: `${frontend}/orders/${order.id}`,
					cancel_url: `${frontend}/?cart=open`,
					// 30 minutes, the shortest Stripe allows (the default is 24 hours).
					// An abandoned session expires, and the reconcile job stops asking
					// about it, within the hour instead of the next day.
					expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
				},
				// Stripe retries a failed create with this key and gets the same
				// session back instead of a second one. The key is per order, and
				// every POST /checkout makes a new order, so it does not merge two
				// separate requests: the storefront disables the button instead.
				{ idempotencyKey: `checkout-${order.id}` },
			)
		} catch (error) {
			await this.orders.transition(order.id, 'failed', 'checkout')
			this.logger.error({
				actionCode: 'checkout.session.create.failed',
				orderId: order.id,
				error: (error as Error).message,
			})
			throw new BadGatewayException('payment provider unavailable')
		}

		await this.prisma.order.update({
			where: { id: order.id },
			data: { stripeSessionId: session.id },
		})
		this.logger.log({
			actionCode: 'checkout.session.create.done',
			orderId: order.id,
			sessionId: session.id,
		})
		return { orderId: order.id, url: session.url as string }
	}
}

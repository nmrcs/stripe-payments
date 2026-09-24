import {
	Inject,
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { OrderStatus } from '@stripe-payments/contracts'
import type Stripe from 'stripe'
import type { Env } from '../config/env'
import { PrismaService } from '../prisma/prisma.service'
import { STRIPE } from '../stripe/stripe.module'
import { OrdersService } from './orders.service'

// What a Checkout Session says about the order, when read directly from Stripe.
// The session is fetched with its PaymentIntent expanded: a delayed payment
// that failed leaves the session `complete` and `unpaid` for good, and only the
// PaymentIntent, back in `requires_payment_method`, tells it apart from one
// still settling.
export function statusFromSession(
	session: Stripe.Checkout.Session,
): OrderStatus | null {
	if (session.status === 'expired') return 'expired'
	if (session.payment_status === 'paid') return 'paid'
	if (session.status !== 'complete') return null
	const intent =
		typeof session.payment_intent === 'object' ? session.payment_intent : null
	if (
		intent?.status === 'requires_payment_method' ||
		intent?.status === 'canceled'
	) {
		return 'failed'
	}
	return 'processing'
}

// A webhook can be lost for good: the endpoint was down longer than Stripe
// retries, or someone disabled it. This job does not wait for events; it asks
// Stripe about every order still open after RECONCILE_AFTER_SECONDS and moves
// it the same way a webhook would.
@Injectable()
export class ReconcileService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(ReconcileService.name)
	private timer?: NodeJS.Timeout

	constructor(
		private readonly prisma: PrismaService,
		private readonly orders: OrdersService,
		private readonly config: ConfigService<Env, true>,
		@Inject(STRIPE) private readonly stripe: Stripe,
	) {}

	onModuleInit(): void {
		const seconds = this.config.get('RECONCILE_INTERVAL_SECONDS', {
			infer: true,
		})
		if (seconds > 0) {
			this.timer = setInterval(() => void this.run(), seconds * 1000)
		}
	}

	onModuleDestroy(): void {
		clearInterval(this.timer)
	}

	async run(): Promise<number> {
		const after = this.config.get('RECONCILE_AFTER_SECONDS', { infer: true })
		const open = await this.prisma.order.findMany({
			where: {
				status: { in: ['pending', 'processing'] },
				stripeSessionId: { not: null },
				createdAt: { lte: new Date(Date.now() - after * 1000) },
			},
			select: { id: true, stripeSessionId: true },
		})

		let moved = 0
		for (const order of open) {
			try {
				const session = await this.stripe.checkout.sessions.retrieve(
					order.stripeSessionId as string,
					{ expand: ['payment_intent'] },
				)
				const to = statusFromSession(session)
				if (to && (await this.orders.transition(order.id, to, 'reconcile'))) {
					moved++
				}
			} catch (error) {
				this.logger.warn({
					actionCode: 'reconcile.session.retrieve.failed',
					orderId: order.id,
					error: (error as Error).message,
				})
			}
		}
		this.logger.log({
			actionCode: 'reconcile.run.done',
			open: open.length,
			moved,
		})
		return moved
	}
}

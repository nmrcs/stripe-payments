import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { OrderStatus } from '@stripe-payments/contracts'
import type Stripe from 'stripe'
import type { Env } from '../config/env'
import { OrdersService } from '../orders/orders.service'
import { PrismaService } from '../prisma/prisma.service'
import { STRIPE } from '../stripe/stripe.module'

export type WebhookResult = { received: true; duplicate: boolean }

// The Checkout events this shop acts on, and the order status each one means.
function statusFromEvent(event: Stripe.Event): OrderStatus | null {
	switch (event.type) {
		case 'checkout.session.completed':
			// Cards are paid at this point; bank debits and vouchers are not yet.
			return event.data.object.payment_status === 'paid' ? 'paid' : 'processing'
		case 'checkout.session.async_payment_succeeded':
			return 'paid'
		case 'checkout.session.async_payment_failed':
			return 'failed'
		case 'checkout.session.expired':
			return 'expired'
		default:
			return null
	}
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// A session created outside this shop (the Dashboard, `stripe trigger`) has no
// orderId; such events are recorded and otherwise ignored.
function orderIdOf(event: Stripe.Event): string | null {
	if (!event.type.startsWith('checkout.session.')) return null
	const session = event.data.object as Stripe.Checkout.Session
	const id = session.metadata?.orderId
	return id && UUID.test(id) ? id : null
}

@Injectable()
export class WebhooksService {
	private readonly logger = new Logger(WebhooksService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly orders: OrdersService,
		private readonly config: ConfigService<Env, true>,
		@Inject(STRIPE) private readonly stripe: Stripe,
	) {}

	async handle(rawBody: Buffer, signature: string): Promise<WebhookResult> {
		let event: Stripe.Event
		try {
			event = this.stripe.webhooks.constructEvent(
				rawBody,
				signature,
				this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true }),
			)
		} catch (error) {
			this.logger.warn({
				actionCode: 'webhooks.signature.rejected',
				error: (error as Error).message,
			})
			throw new BadRequestException('invalid signature')
		}

		const orderId = orderIdOf(event)
		const to = statusFromEvent(event)

		// The event row and the order change commit together. If the change
		// throws, neither is saved, Stripe gets a 500 and delivers again.
		const duplicate = await this.prisma.$transaction(async (tx) => {
			const { count } = await tx.stripeEvent.createMany({
				data: [{ id: event.id, type: event.type, orderId }],
				skipDuplicates: true,
			})
			if (count === 0) return true
			if (orderId && to) {
				await this.orders.transition(orderId, to, 'webhook', tx)
			}
			return false
		})

		this.logger.log({
			actionCode: duplicate
				? 'webhooks.event.duplicate'
				: 'webhooks.event.applied',
			eventId: event.id,
			type: event.type,
			orderId,
		})
		return { received: true, duplicate }
	}
}

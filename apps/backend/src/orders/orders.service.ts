import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { Order, OrderStatus } from '@stripe-payments/contracts'
import type { Prisma } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { allowedFrom } from './order-status'

// Who asked for the move, for the log line.
export type TransitionSource = 'webhook' | 'reconcile' | 'checkout'

type Db = PrismaService | Prisma.TransactionClient

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name)

	constructor(private readonly prisma: PrismaService) {}

	async get(id: string): Promise<Order> {
		const order = await this.prisma.order.findUnique({
			where: { id },
			include: { items: { include: { product: true } } },
		})
		if (!order) throw new NotFoundException('order not found')
		return {
			id: order.id,
			status: order.status,
			totalCents: order.totalCents,
			currency: order.currency,
			createdAt: order.createdAt.toISOString(),
			paidAt: order.paidAt?.toISOString() ?? null,
			items: order.items.map((item) => ({
				productId: item.productId,
				name: item.product.name,
				quantity: item.quantity,
				unitPriceCents: item.unitPriceCents,
			})),
		}
	}

	// Moves the order only if its current status allows it. The check and the
	// write are one UPDATE ... WHERE status IN (...), so two deliveries racing
	// each other cannot both apply. Returns whether the order changed.
	async transition(
		orderId: string,
		to: OrderStatus,
		source: TransitionSource,
		db: Db = this.prisma,
	): Promise<boolean> {
		const { count } = await db.order.updateMany({
			where: { id: orderId, status: { in: allowedFrom(to) } },
			data: { status: to, ...(to === 'paid' ? { paidAt: new Date() } : {}) },
		})
		this.logger.log({
			actionCode: count
				? 'orders.transition.applied'
				: 'orders.transition.ignored',
			orderId,
			to,
			source,
		})
		return count === 1
	}
}

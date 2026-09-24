import { z } from 'zod'

// pending    - order created, customer is on the Stripe page
// processing - checkout completed, an asynchronous payment method is settling
// paid, failed, expired - final
export const OrderStatus = z.enum([
	'pending',
	'processing',
	'paid',
	'failed',
	'expired',
])
export type OrderStatus = z.infer<typeof OrderStatus>

export const FINAL_STATUSES: readonly OrderStatus[] = [
	'paid',
	'failed',
	'expired',
]

export const OrderLine = z.object({
	productId: z.string().uuid(),
	name: z.string(),
	quantity: z.number().int().positive(),
	unitPriceCents: z.number().int().positive(),
})
export type OrderLine = z.infer<typeof OrderLine>

export const Order = z.object({
	id: z.string().uuid(),
	status: OrderStatus,
	totalCents: z.number().int().positive(),
	currency: z.string().length(3),
	items: z.array(OrderLine),
	createdAt: z.string(),
	paidAt: z.string().nullable(),
})
export type Order = z.infer<typeof Order>

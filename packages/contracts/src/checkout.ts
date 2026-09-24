import { z } from 'zod'

export const CheckoutItem = z.object({
	productId: z.string().uuid(),
	quantity: z.number().int().min(1).max(10),
})
export type CheckoutItem = z.infer<typeof CheckoutItem>

// Only ids and quantities come from the client. Prices are read from the
// database, so a tampered request cannot change what Stripe charges.
export const CheckoutRequest = z.object({
	items: z
		.array(CheckoutItem)
		.min(1)
		.max(10)
		.refine(
			(items) => new Set(items.map((i) => i.productId)).size === items.length,
			{ message: 'each product may appear once' },
		),
})
export type CheckoutRequest = z.infer<typeof CheckoutRequest>

export const CheckoutResponse = z.object({
	orderId: z.string().uuid(),
	url: z.string().url(),
})
export type CheckoutResponse = z.infer<typeof CheckoutResponse>

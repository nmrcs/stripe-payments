import { z } from 'zod'

// Prices are integers in the smallest currency unit, the way Stripe takes them.
export const Product = z.object({
	id: z.string().uuid(),
	slug: z.string(),
	name: z.string(),
	description: z.string(),
	priceCents: z.number().int().positive(),
	currency: z.string().length(3),
	imageUrl: z.string(),
})
export type Product = z.infer<typeof Product>

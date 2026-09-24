import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartLine = { productId: string; quantity: number }

export const MAX_QUANTITY = 10

type CartState = {
	lines: CartLine[]
	isOpen: boolean
	setOpen: (isOpen: boolean) => void
	quantityOf: (productId: string) => number
	// 0 removes the line; anything above MAX_QUANTITY is capped.
	setQuantity: (productId: string, quantity: number) => void
	clear: () => void
}

// Lines are persisted, so the cart is still there when the customer comes back
// from the Stripe page. Only ids and quantities are kept; prices always come
// from the API. Whether the drawer is open is not persisted.
export const useCart = create<CartState>()(
	persist(
		(set, get) => ({
			lines: [],
			isOpen: false,
			setOpen: (isOpen) => set({ isOpen }),
			quantityOf: (productId) =>
				get().lines.find((l) => l.productId === productId)?.quantity ?? 0,
			setQuantity: (productId, quantity) =>
				set((s) => {
					const q = Math.min(
						Math.max(Math.trunc(quantity) || 0, 0),
						MAX_QUANTITY,
					)
					const rest = s.lines.filter((l) => l.productId !== productId)
					if (q === 0) return { lines: rest }
					const exists = rest.length !== s.lines.length
					return {
						lines: exists
							? s.lines.map((l) =>
									l.productId === productId ? { ...l, quantity: q } : l,
								)
							: [...s.lines, { productId, quantity: q }],
					}
				}),
			clear: () => set({ lines: [] }),
		}),
		{
			name: 'stripe-payments-cart',
			partialize: (s) => ({ lines: s.lines }),
		},
	),
)

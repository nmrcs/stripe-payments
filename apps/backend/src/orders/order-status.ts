import type { OrderStatus } from '@stripe-payments/contracts'

// Every move an order may make. Anything not listed is refused, which is what
// makes late, repeated and out-of-order events harmless: a `processing` that
// arrives after `paid` has nowhere to go.
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
	pending: ['processing', 'paid', 'failed', 'expired'],
	processing: ['paid', 'failed'],
	paid: [],
	failed: [],
	expired: [],
}

export function canMove(from: OrderStatus, to: OrderStatus): boolean {
	return NEXT[from].includes(to)
}

// The statuses an order must be in for a move to `to` to be allowed.
export function allowedFrom(to: OrderStatus): OrderStatus[] {
	return (Object.keys(NEXT) as OrderStatus[]).filter((from) =>
		canMove(from, to),
	)
}

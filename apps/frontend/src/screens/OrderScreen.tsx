import { Card, Chip, Separator } from '@heroui/react'
import { FINAL_STATUSES, type Order } from '@stripe-payments/contracts'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../api/client'
import { money } from '../format'
import { useCart } from '../store/cart'

const STATUS: Record<
	Order['status'],
	{ label: string; color: 'default' | 'warning' | 'success' | 'danger' }
> = {
	pending: { label: 'Waiting for Stripe', color: 'default' },
	processing: { label: 'Payment is settling', color: 'warning' },
	paid: { label: 'Paid', color: 'success' },
	failed: { label: 'Payment failed', color: 'danger' },
	expired: { label: 'Checkout expired', color: 'danger' },
}

// Stripe sends the customer here as soon as they pay, often before the webhook
// lands. The page polls the order until the webhook (or the reconcile job) has
// moved it to a final status.
export function OrderScreen() {
	const { id } = useParams<{ id: string }>()
	const clearCart = useCart((s) => s.clear)
	const [order, setOrder] = useState<Order | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		let stopped = false
		const load = () =>
			getOrder(id)
				.then((o) => {
					if (stopped) return
					setOrder(o)
					if (FINAL_STATUSES.includes(o.status)) {
						stopped = true
						clearInterval(timer)
						if (o.status === 'paid') clearCart()
					}
				})
				.catch((e: Error) => setError(e.message))
		const timer = setInterval(load, 1000)
		void load()
		return () => {
			stopped = true
			clearInterval(timer)
		}
	}, [id, clearCart])

	if (error) return <p className="text-danger">{error}</p>
	if (!order) return <p className="text-muted">Loading…</p>

	const status = STATUS[order.status]
	return (
		<Card className="mx-auto my-14 w-full max-w-lg">
			<Card.Header>
				<div className="flex items-center justify-between gap-3">
					<Card.Title className="font-display text-2xl">Order</Card.Title>
					<Chip color={status.color} variant="soft">
						{status.label}
					</Chip>
				</div>
				<Card.Description className="font-mono text-xs">
					{order.id}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<ul className="flex flex-col gap-2 text-sm">
					{order.items.map((item) => (
						<li key={item.productId} className="flex justify-between">
							<span>
								{item.name} × {item.quantity}
							</span>
							<span>
								{money(item.unitPriceCents * item.quantity, order.currency)}
							</span>
						</li>
					))}
				</ul>
				<Separator className="my-4" />
				<p className="flex justify-between text-lg font-semibold">
					<span>Total</span>
					<span>{money(order.totalCents, order.currency)}</span>
				</p>
			</Card.Content>
			<Card.Footer>
				<Link to="/" className="text-sm underline">
					Back to the shop
				</Link>
			</Card.Footer>
		</Card>
	)
}

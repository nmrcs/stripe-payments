import { Button, Drawer, EmptyState } from '@heroui/react'
import { useState } from 'react'
import { createCheckout } from '../api/client'
import { money } from '../format'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../store/cart'
import { QuantityStepper } from './QuantityStepper'

export function CartDrawer() {
	const { lines, isOpen, setOpen } = useCart()
	const { products } = useProducts()
	const [paying, setPaying] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const rows = lines.flatMap((line) => {
		const product = products?.find((p) => p.id === line.productId)
		return product ? [{ ...line, product }] : []
	})
	const currency = rows[0]?.product.currency ?? 'usd'
	const total = rows.reduce(
		(sum, r) => sum + r.product.priceCents * r.quantity,
		0,
	)

	async function pay() {
		setPaying(true)
		setError(null)
		try {
			const { url } = await createCheckout({
				items: lines.map(({ productId, quantity }) => ({
					productId,
					quantity,
				})),
			})
			window.location.href = url
		} catch (e) {
			setError((e as Error).message)
			setPaying(false)
		}
	}

	return (
		<Drawer isOpen={isOpen} onOpenChange={setOpen}>
			<Drawer.Backdrop>
				<Drawer.Content placement="right">
					<Drawer.Dialog className="flex w-full max-w-md flex-col">
						<Drawer.Header>
							<Drawer.Heading className="text-lg font-semibold">
								Cart
							</Drawer.Heading>
							<Drawer.CloseTrigger />
						</Drawer.Header>
						<Drawer.Body className="flex-1 overflow-y-auto">
							{rows.length === 0 ? (
								<EmptyState className="py-16">The cart is empty.</EmptyState>
							) : (
								<ul className="flex flex-col gap-5">
									{rows.map((r) => (
										<li key={r.productId} className="flex items-center gap-4">
											<img
												src={r.product.imageUrl}
												alt=""
												className="size-16 rounded-xl bg-[#141416] object-contain p-1.5"
											/>
											<div className="min-w-0 flex-1">
												<div className="truncate font-medium text-foreground">
													{r.product.name}
												</div>
												<div className="text-sm text-muted">
													{money(
														r.product.priceCents * r.quantity,
														r.product.currency,
													)}
												</div>
											</div>
											<QuantityStepper
												productId={r.productId}
												name={r.product.name}
												size="sm"
												variant="secondary"
											/>
										</li>
									))}
								</ul>
							)}
						</Drawer.Body>
						{rows.length > 0 && (
							<Drawer.Footer className="flex flex-col gap-3">
								<div className="flex w-full items-center justify-between text-lg font-semibold">
									<span>Total</span>
									<span>{money(total, currency)}</span>
								</div>
								{error && (
									<p className="w-full text-sm text-danger" role="alert">
										{error}
									</p>
								)}
								<Button fullWidth size="lg" isPending={paying} onPress={pay}>
									{paying ? (
										'Opening Stripe…'
									) : (
										<>
											Pay with
											{/* Official white wordmark from Stripe's brand assets,
											    which allow it on checkout pages. */}
											<img
												src="/stripe-wordmark-white.svg"
												alt="Stripe"
												className="h-6 w-auto"
											/>
										</>
									)}
								</Button>
							</Drawer.Footer>
						)}
					</Drawer.Dialog>
				</Drawer.Content>
			</Drawer.Backdrop>
		</Drawer>
	)
}

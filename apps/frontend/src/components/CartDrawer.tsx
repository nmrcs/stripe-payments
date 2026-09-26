import { Alert, Button, Drawer, EmptyState } from '@heroui/react'
import { useState } from 'react'
import { createCheckout } from '../api/client'
import { money } from '../format'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../store/cart'
import { TrashIcon } from './Icons'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'
import { StripeWordmark } from './StripeWordmark'

export function CartDrawer() {
	const { lines, isOpen, setOpen, setQuantity } = useCart()
	const { products } = useProducts()
	const [paying, setPaying] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const rows = lines.flatMap((line) => {
		const product = products?.find((p) => p.id === line.productId)
		return product ? [{ ...line, product }] : []
	})
	const currency = rows[0]?.product.currency ?? 'usd'
	const count = rows.reduce((n, r) => n + r.quantity, 0)
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
					<Drawer.Dialog className="flex w-full max-w-md flex-col px-0">
						<Drawer.Header className="mx-6 border-b border-separator pb-4">
							<Drawer.Heading className="font-display text-2xl">
								Your cart
							</Drawer.Heading>
							<Drawer.CloseTrigger />
						</Drawer.Header>
						{/* Side padding lives inside the scroller, so the scrollbar sits on the
						    drawer's right edge, not 24px in. */}
						<Drawer.Body className="m-0 flex-1 overflow-y-auto px-6">
							{rows.length === 0 ? (
								<EmptyState className="flex h-full flex-col items-center justify-center gap-3 text-center">
									<p className="font-display text-xl">Nothing here yet</p>
									<p className="max-w-60 text-sm text-muted">
										Add something from the shop and it will wait for you here.
									</p>
								</EmptyState>
							) : (
								<ul className="divide-y divide-separator">
									{rows.map((r) => (
										<li key={r.productId} className="flex gap-6 py-5">
											{/* As tall as the text beside it, and square. */}
											<div className="shrink-0 self-stretch">
												<ProductImage
													src={r.product.imageUrl}
													className="aspect-square h-full min-h-20 rounded-2xl"
												/>
											</div>
											<div className="flex min-w-0 flex-1 flex-col">
												<div className="flex items-start justify-between gap-3">
													<span className="line-clamp-2 text-sm leading-snug font-medium">
														{r.product.name}
													</span>
													<span className="tabular shrink-0 text-sm font-semibold">
														{money(
															r.product.priceCents * r.quantity,
															r.product.currency,
														)}
													</span>
												</div>
												<span className="tabular mt-1 text-xs text-muted">
													{money(r.product.priceCents, r.product.currency)} each
												</span>
												<div className="mt-auto flex items-center justify-between pt-3">
													<QuantityStepper
														productId={r.productId}
														name={r.product.name}
														size="sm"
													/>
													<Button
														isIconOnly
														size="sm"
														variant="ghost"
														aria-label={`Remove ${r.product.name}`}
														onPress={() => setQuantity(r.productId, 0)}
													>
														<TrashIcon className="size-4" />
													</Button>
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</Drawer.Body>
						{rows.length > 0 && (
							<Drawer.Footer className="mx-6 flex flex-col gap-3 border-t border-separator pt-4">
								<div className="flex w-full items-baseline justify-between">
									<span className="text-muted">
										{count} {count === 1 ? 'item' : 'items'}
									</span>
									<span className="tabular text-xl font-semibold">
										{money(total, currency)}
									</span>
								</div>
								<p className="w-full text-xs text-muted">
									The backend prices the order again from the catalog before
									Stripe opens.
								</p>
								{error && (
									<Alert status="danger">
										<Alert.Indicator />
										<Alert.Content>
											<Alert.Description>{error}</Alert.Description>
										</Alert.Content>
									</Alert>
								)}
								<Button fullWidth size="lg" isPending={paying} onPress={pay}>
									{paying ? (
										'Opening Stripe…'
									) : (
										<>
											Pay with
											<StripeWordmark className="h-6" />
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

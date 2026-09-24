import { Button } from '@heroui/react'
import type { Product } from '@stripe-payments/contracts'
import { money } from '../format'
import { useCart } from '../store/cart'
import { QuantityStepper } from './QuantityStepper'

// Two layers: an outer card with the name and the price on one line, and an
// inset panel for the picture.
export function ProductCard({ product }: { product: Product }) {
	const inCart = useCart((s) => s.quantityOf(product.id) > 0)
	const setQuantity = useCart((s) => s.setQuantity)
	return (
		<article className="flex flex-col gap-3 rounded-[28px] bg-[#2a2a2e] p-2.5">
			<header className="flex items-center justify-between gap-3 px-3 pt-2">
				<h2 className="text-lg font-semibold text-white">{product.name}</h2>
				<span className="flex items-center gap-2 text-neutral-400">
					<span className="size-2.5 rounded-full bg-accent" aria-hidden />
					{money(product.priceCents, product.currency)}
				</span>
			</header>
			<div className="rounded-[20px] bg-[#141416] px-4 py-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
				<img
					src={product.imageUrl}
					alt=""
					className="mx-auto aspect-square w-full object-contain"
				/>
			</div>
			<footer className="flex items-center justify-between gap-3 px-3 pb-2">
				<p className="text-sm text-neutral-400">{product.description}</p>
				<div className="shrink-0">
					{inCart ? (
						<QuantityStepper
							productId={product.id}
							name={product.name}
							size="sm"
						/>
					) : (
						<Button size="sm" onPress={() => setQuantity(product.id, 1)}>
							Add to cart
						</Button>
					)}
				</div>
			</footer>
		</article>
	)
}

import { Button } from '@heroui/react'
import type { Product } from '@stripe-payments/contracts'
import { money } from '../format'
import { useCart } from '../store/cart'
import { ProductImage } from './ProductImage'
import { QuantityStepper } from './QuantityStepper'

export function ProductCard({ product }: { product: Product }) {
	const inCart = useCart((s) => s.quantityOf(product.id) > 0)
	const setQuantity = useCart((s) => s.setQuantity)
	return (
		<article className="group flex h-full flex-col">
			<div className="overflow-hidden rounded-2xl">
				<ProductImage
					src={product.imageUrl}
					className="aspect-square transition-transform duration-500 ease-out group-hover:scale-[1.03]"
				/>
			</div>
			<div className="mt-4 flex flex-1 flex-col">
				<h2 className="leading-snug font-medium">{product.name}</h2>
				<p className="mt-1 line-clamp-2 text-sm text-muted">
					{product.description}
				</p>
				<span className="tabular mt-2 text-[15px] font-semibold">
					{money(product.priceCents, product.currency)}
				</span>
				<div className="mt-auto pt-4">
					{inCart ? (
						<QuantityStepper
							productId={product.id}
							name={product.name}
							size="sm"
						/>
					) : (
						<Button
							size="sm"
							variant="secondary"
							onPress={() => setQuantity(product.id, 1)}
						>
							Add to cart
						</Button>
					)}
				</div>
			</div>
		</article>
	)
}

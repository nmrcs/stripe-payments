import { Skeleton } from '@heroui/react'
import { ProductCard } from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'

export function CatalogScreen() {
	const { products, error } = useProducts()
	return (
		<div className="flex flex-col gap-10 pb-16">
			<section className="pt-10 sm:pt-14">
				<h1 className="font-display text-4xl sm:text-6xl">Catalog</h1>
				<p className="mt-3 max-w-xl text-muted">
					Six products to pay for through Stripe Checkout. Test mode: no card is
					charged.
				</p>
			</section>
			{error ? (
				<p className="text-danger" role="alert">
					{error}
				</p>
			) : (
				<ul className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:gap-x-8">
					{products
						? products.map((p) => (
								<li key={p.id}>
									<ProductCard product={p} />
								</li>
							))
						: Array.from({ length: 6 }, (_, i) => (
								<li key={i} className="flex flex-col gap-3">
									<Skeleton className="aspect-square rounded-2xl" />
									<Skeleton className="h-4 w-3/5 rounded" />
									<Skeleton className="h-3 w-4/5 rounded" />
									<Skeleton className="h-4 w-1/4 rounded" />
								</li>
							))}
				</ul>
			)}
		</div>
	)
}

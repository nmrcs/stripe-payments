import { Skeleton } from '@heroui/react'
import { ProductCard } from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'

export function CatalogScreen() {
	const { products, error } = useProducts()
	if (error) return <p className="text-danger">{error}</p>
	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{products
				? products.map((p) => <ProductCard key={p.id} product={p} />)
				: [0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-96 rounded-[28px]" />
					))}
		</div>
	)
}

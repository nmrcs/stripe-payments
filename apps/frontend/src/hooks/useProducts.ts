import type { Product } from '@stripe-payments/contracts'
import { useEffect, useState } from 'react'
import { listProducts } from '../api/client'

// The catalog and the cart both need the product list; one request serves
// both for the life of the page.
let request: Promise<Product[]> | null = null

export function useProducts(): {
	products: Product[] | null
	error: string | null
} {
	const [products, setProducts] = useState<Product[] | null>(null)
	const [error, setError] = useState<string | null>(null)
	useEffect(() => {
		request ??= listProducts()
		request.then(setProducts).catch((e: Error) => {
			request = null
			setError(e.message)
		})
	}, [])
	return { products, error }
}

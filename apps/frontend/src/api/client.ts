import type {
	CheckoutRequest,
	CheckoutResponse,
	Order,
	Product,
} from '@stripe-payments/contracts'

const BASE = import.meta.env.VITE_BACKEND_URL

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...init.headers },
	})
	if (!res.ok) {
		const body = await res.text()
		throw new Error(`${res.status} ${res.statusText}: ${body}`)
	}
	return res.json() as Promise<T>
}

export function listProducts(): Promise<Product[]> {
	return request('/products')
}

export function createCheckout(
	body: CheckoutRequest,
): Promise<CheckoutResponse> {
	return request('/checkout', { method: 'POST', body: JSON.stringify(body) })
}

export function getOrder(id: string): Promise<Order> {
	return request(`/orders/${id}`)
}

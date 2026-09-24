import { Badge, Button } from '@heroui/react'
import { useEffect } from 'react'
import {
	Link,
	Navigate,
	Route,
	Routes,
	useSearchParams,
} from 'react-router-dom'
import { CartDrawer } from './components/CartDrawer'
import { CatalogScreen } from './screens/CatalogScreen'
import { OrderScreen } from './screens/OrderScreen'
import { useCart } from './store/cart'

// Stripe's cancel_url is /?cart=open: a customer who backs out of payment
// lands on the shop with the cart open, as they left it.
function OpenCartFromUrl() {
	const [params, setParams] = useSearchParams()
	const setOpen = useCart((s) => s.setOpen)
	useEffect(() => {
		if (params.get('cart') === 'open') {
			setOpen(true)
			setParams({}, { replace: true })
		}
	}, [params, setParams, setOpen])
	return null
}

export function App() {
	const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0))
	const setOpen = useCart((s) => s.setOpen)
	return (
		<div className="flex min-h-screen flex-col bg-[#050505] text-foreground">
			<header className="border-b border-white/5">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
					<Link to="/" className="text-lg font-semibold">
						stripe-payments
					</Link>
					<Badge.Anchor>
						<Button
							variant="secondary"
							aria-label={count ? `Cart, ${count} items` : 'Cart'}
							onPress={() => setOpen(true)}
						>
							Cart
						</Button>
						{count > 0 && (
							<Badge color="accent" size="sm">
								{count}
							</Badge>
						)}
					</Badge.Anchor>
				</div>
			</header>
			<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-8">
				<Routes>
					<Route path="/" element={<CatalogScreen />} />
					<Route path="/orders/:id" element={<OrderScreen />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</main>
			<OpenCartFromUrl />
			<CartDrawer />
		</div>
	)
}

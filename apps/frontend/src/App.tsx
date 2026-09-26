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
import { BagIcon } from './components/Icons'
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
		<div className="flex min-h-screen flex-col">
			<header className="sticky top-0 z-30 h-16 shrink-0 border-b border-separator bg-background">
				<div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
					<Link
						to="/"
						className="text-lg font-bold tracking-[0.18em] uppercase"
					>
						Store
					</Link>
					<Badge.Anchor>
						<Button
							variant="ghost"
							aria-label={count ? `Cart, ${count} items` : 'Cart'}
							onPress={() => setOpen(true)}
						>
							<BagIcon className="size-5" />
							<span className="hidden sm:inline">Cart</span>
						</Button>
						{count > 0 && (
							<Badge color="accent" size="sm">
								{count}
							</Badge>
						)}
					</Badge.Anchor>
				</div>
			</header>
			<main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6">
				<Routes>
					<Route path="/" element={<CatalogScreen />} />
					<Route path="/orders/:id" element={<OrderScreen />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</main>
			<footer className="border-t border-separator">
				<div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted sm:px-6">
					A demo store in Stripe test mode. Nothing here is for sale.
				</div>
			</footer>
			<OpenCartFromUrl />
			<CartDrawer />
		</div>
	)
}

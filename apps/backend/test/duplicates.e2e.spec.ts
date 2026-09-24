import {
	deliver,
	type Harness,
	placeOrder,
	sessionEvent,
	startApp,
	statusOf,
} from './harness'

// 2. Duplicates. Stripe may deliver one event more than once. The second copy
// must not fulfil the order again.
describe('duplicate delivery', () => {
	let h: Harness
	let orderId: string

	beforeEach(async () => {
		h = await startApp()
		orderId = await placeOrder(h)
	})
	afterEach(() => h.close())

	it('applies the same event once', async () => {
		const body = JSON.stringify(
			sessionEvent('checkout.session.completed', orderId, {}, 'evt_test_dup'),
		)

		const first = await deliver(h, body).expect(200)
		const paidAt = (
			await h.prisma.order.findUniqueOrThrow({ where: { id: orderId } })
		).paidAt
		const second = await deliver(h, body).expect(200)

		expect(first.body).toEqual({ received: true, duplicate: false })
		expect(second.body).toEqual({ received: true, duplicate: true })
		expect(await h.prisma.stripeEvent.count()).toBe(1)
		const order = await h.prisma.order.findUniqueOrThrow({
			where: { id: orderId },
		})
		expect(order.status).toBe('paid')
		expect(order.paidAt).toEqual(paidAt)
	})

	it('survives two copies arriving at the same time', async () => {
		const body = JSON.stringify(
			sessionEvent('checkout.session.completed', orderId, {}, 'evt_test_race'),
		)
		const results = await Promise.all([deliver(h, body), deliver(h, body)])

		expect(results.map((r) => r.status)).toEqual([200, 200])
		expect(await h.prisma.stripeEvent.count()).toBe(1)
		expect(await statusOf(h, orderId)).toBe('paid')
	})
})

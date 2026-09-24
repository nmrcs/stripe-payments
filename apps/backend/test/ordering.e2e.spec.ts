import {
	deliver,
	type Harness,
	placeOrder,
	sessionEvent,
	startApp,
	statusOf,
} from './harness'

// 3. Order. Stripe does not deliver events in the order they happened. With a
// bank debit, `completed` (unpaid) is followed by `async_payment_succeeded`;
// when the second overtakes the first, the late `completed` must not pull a
// paid order back to processing.
describe('out-of-order delivery', () => {
	let h: Harness
	let orderId: string

	beforeEach(async () => {
		h = await startApp()
		orderId = await placeOrder(h)
	})
	afterEach(() => h.close())

	it('in order: processing, then paid', async () => {
		await deliver(
			h,
			JSON.stringify(
				sessionEvent('checkout.session.completed', orderId, {
					payment_status: 'unpaid',
				}),
			),
		).expect(200)
		expect(await statusOf(h, orderId)).toBe('processing')

		await deliver(
			h,
			JSON.stringify(
				sessionEvent('checkout.session.async_payment_succeeded', orderId),
			),
		).expect(200)
		expect(await statusOf(h, orderId)).toBe('paid')
	})

	it('reversed: stays paid', async () => {
		await deliver(
			h,
			JSON.stringify(
				sessionEvent('checkout.session.async_payment_succeeded', orderId),
			),
		).expect(200)
		await deliver(
			h,
			JSON.stringify(
				sessionEvent('checkout.session.completed', orderId, {
					payment_status: 'unpaid',
				}),
			),
		).expect(200)

		expect(await statusOf(h, orderId)).toBe('paid')
		expect(await h.prisma.stripeEvent.count()).toBe(2)
	})

	it('a late expiry does not cancel a paid order', async () => {
		await deliver(
			h,
			JSON.stringify(sessionEvent('checkout.session.completed', orderId)),
		).expect(200)
		await deliver(
			h,
			JSON.stringify(
				sessionEvent('checkout.session.expired', orderId, {
					status: 'expired',
				}),
			),
		).expect(200)

		expect(await statusOf(h, orderId)).toBe('paid')
	})
})

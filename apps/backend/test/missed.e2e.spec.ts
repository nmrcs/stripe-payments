import { ReconcileService } from '../src/orders/reconcile.service'
import { type Harness, placeOrder, startApp, statusOf } from './harness'

// 4. Missed. No webhook arrives at all: the endpoint was down past Stripe's
// retries. The reconcile job reads the session from Stripe instead.
describe('missed webhook', () => {
	let h: Harness
	let orderId: string

	beforeEach(async () => {
		h = await startApp()
		orderId = await placeOrder(h)
	})
	afterEach(() => h.close())

	function sessionFromStripe(session: Record<string, unknown>): void {
		jest
			.spyOn(h.stripe.checkout.sessions, 'retrieve')
			.mockResolvedValue({ id: 'cs_test_1', ...session } as never)
	}

	it('marks a paid session paid', async () => {
		sessionFromStripe({ status: 'complete', payment_status: 'paid' })

		const moved = await h.app.get(ReconcileService).run()

		expect(moved).toBe(1)
		expect(await statusOf(h, orderId)).toBe('paid')
		expect(await h.prisma.stripeEvent.count()).toBe(0)
	})

	it('marks an expired session expired', async () => {
		sessionFromStripe({ status: 'expired', payment_status: 'unpaid' })

		await h.app.get(ReconcileService).run()

		expect(await statusOf(h, orderId)).toBe('expired')
	})

	it('marks a failed delayed payment failed', async () => {
		sessionFromStripe({
			status: 'complete',
			payment_status: 'unpaid',
			payment_intent: { id: 'pi_test_1', status: 'requires_payment_method' },
		})

		await h.app.get(ReconcileService).run()

		expect(await statusOf(h, orderId)).toBe('failed')
	})

	it('keeps a delayed payment that is still settling in processing', async () => {
		sessionFromStripe({
			status: 'complete',
			payment_status: 'unpaid',
			payment_intent: { id: 'pi_test_1', status: 'processing' },
		})

		await h.app.get(ReconcileService).run()

		expect(await statusOf(h, orderId)).toBe('processing')
		expect(h.stripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
			'cs_test_1',
			{ expand: ['payment_intent'] },
		)
	})

	it('leaves an open session alone', async () => {
		sessionFromStripe({ status: 'open', payment_status: 'unpaid' })

		expect(await h.app.get(ReconcileService).run()).toBe(0)
		expect(await statusOf(h, orderId)).toBe('pending')
	})

	it('keeps going when Stripe is unreachable', async () => {
		jest
			.spyOn(h.stripe.checkout.sessions, 'retrieve')
			.mockRejectedValue(new Error('connect ETIMEDOUT'))

		expect(await h.app.get(ReconcileService).run()).toBe(0)
		expect(await statusOf(h, orderId)).toBe('pending')
	})
})

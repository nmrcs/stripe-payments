import request from 'supertest'
import {
	deliver,
	type Harness,
	placeOrder,
	sessionEvent,
	startApp,
	statusOf,
} from './harness'

// 1. Signature. Stripe signs the exact bytes it sends. A body that was parsed
// and serialized again is a different string, and its signature fails even
// though the JSON is the same.
describe('webhook signature', () => {
	let h: Harness
	let orderId: string

	beforeEach(async () => {
		h = await startApp()
		orderId = await placeOrder(h)
	})
	afterEach(() => h.close())

	it('accepts the bytes Stripe signed', async () => {
		const body = JSON.stringify(
			sessionEvent('checkout.session.completed', orderId),
			null,
			2,
		)
		await deliver(h, body).expect(200)
		expect(await statusOf(h, orderId)).toBe('paid')
	})

	it('rejects the same JSON serialized again', async () => {
		const signed = JSON.stringify(
			sessionEvent('checkout.session.completed', orderId),
			null,
			2,
		)
		const reserialized = JSON.stringify(JSON.parse(signed))
		await deliver(h, reserialized, signed).expect(400)
		expect(await statusOf(h, orderId)).toBe('pending')
		expect(await h.prisma.stripeEvent.count()).toBe(0)
	})

	it('rejects a forged signature', async () => {
		const body = JSON.stringify(
			sessionEvent('checkout.session.completed', orderId),
		)
		await request(h.app.getHttpServer())
			.post('/webhooks/stripe')
			.set('Content-Type', 'application/json')
			.set(
				'Stripe-Signature',
				`t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`,
			)
			.send(body)
			.expect(400)
		expect(await statusOf(h, orderId)).toBe('pending')
	})
})

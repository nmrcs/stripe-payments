import request from 'supertest'
import { type Harness, startApp } from './harness'

describe('checkout', () => {
	let h: Harness

	beforeEach(async () => {
		h = await startApp()
	})
	afterEach(() => h.close())

	it('prices the order from the database and opens one session', async () => {
		const product = await h.prisma.product.findFirstOrThrow()
		const res = await request(h.app.getHttpServer())
			.post('/checkout')
			.send({ items: [{ productId: product.id, quantity: 3, priceCents: 1 }] })
			.expect(201)

		const order = await h.prisma.order.findUniqueOrThrow({
			where: { id: res.body.orderId },
		})
		expect(order.totalCents).toBe(3600)
		expect(order.stripeSessionId).toBe('cs_test_1')
		expect(res.body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_1')

		const [params, options] = (h.stripe.checkout.sessions.create as jest.Mock)
			.mock.calls[0]
		expect(params.line_items[0].price_data.unit_amount).toBe(1200)
		expect(params.metadata.orderId).toBe(order.id)
		expect(options.idempotencyKey).toBe(`checkout-${order.id}`)
		const ttl = params.expires_at - Math.floor(Date.now() / 1000)
		expect(ttl).toBeGreaterThan(30 * 60)
		expect(ttl).toBeLessThanOrEqual(31 * 60)
	})

	it('refuses an unknown product', async () => {
		await request(h.app.getHttpServer())
			.post('/checkout')
			.send({
				items: [
					{ productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
				],
			})
			.expect(400)
	})

	it('marks the order failed when Stripe is down', async () => {
		;(h.stripe.checkout.sessions.create as jest.Mock).mockRejectedValueOnce(
			new Error('connect ETIMEDOUT'),
		)
		const product = await h.prisma.product.findFirstOrThrow()
		await request(h.app.getHttpServer())
			.post('/checkout')
			.send({ items: [{ productId: product.id, quantity: 1 }] })
			.expect(502)
		const order = await h.prisma.order.findFirstOrThrow()
		expect(order.status).toBe('failed')
	})
})

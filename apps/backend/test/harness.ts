import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import Stripe from 'stripe'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { STRIPE } from '../src/stripe/stripe.module'

export const WEBHOOK_SECRET = 'whsec_test_secret'

export type Harness = {
	app: INestApplication
	prisma: PrismaService
	stripe: Stripe
	close: () => Promise<void>
}

// The whole app against the test database, with a real Stripe client whose
// network calls are stubbed. Signature checks run for real: they are local
// HMAC and need no network.
export async function startApp(): Promise<Harness> {
	const stripe = new Stripe('sk_test_offline')
	let sessions = 0
	jest
		.spyOn(stripe.checkout.sessions, 'create')
		.mockImplementation((async () => {
			sessions++
			const id = `cs_test_${sessions}`
			return { id, url: `https://checkout.stripe.com/c/pay/${id}` }
		}) as never)

	const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
		.overrideProvider(STRIPE)
		.useValue(stripe)
		.compile()
	const app = moduleRef.createNestApplication({ rawBody: true, logger: false })
	await app.init()

	const prisma = app.get(PrismaService)
	await prisma.$executeRawUnsafe(
		'TRUNCATE "StripeEvent", "OrderItem", "Order", "Product" CASCADE',
	)
	await prisma.product.create({
		data: {
			slug: 'field-notebook',
			name: 'Field Notebook',
			description: 'Dot grid, 96 pages.',
			priceCents: 1200,
			currency: 'usd',
			imageUrl: '/products/field-notebook.svg',
		},
	})
	return { app, prisma, stripe, close: () => app.close() }
}

// Places an order through the API, as the storefront does.
export async function placeOrder(h: Harness): Promise<string> {
	const product = await h.prisma.product.findFirstOrThrow()
	const res = await request(h.app.getHttpServer())
		.post('/checkout')
		.send({ items: [{ productId: product.id, quantity: 2 }] })
		.expect(201)
	return res.body.orderId as string
}

let eventCounter = 0

// A Checkout Session event shaped like the ones Stripe sends.
export function sessionEvent(
	type: string,
	orderId: string,
	session: Record<string, unknown> = {},
	id = `evt_test_${++eventCounter}`,
): Record<string, unknown> {
	return {
		id,
		object: 'event',
		type,
		created: Math.floor(Date.now() / 1000),
		data: {
			object: {
				id: 'cs_test_1',
				object: 'checkout.session',
				metadata: { orderId },
				status: 'complete',
				payment_status: 'paid',
				...session,
			},
		},
	}
}

// Posts `body` byte for byte with a signature. `signedBody` lets a test sign
// one string and send another.
export function deliver(
	h: Harness,
	body: string,
	signedBody: string = body,
): request.Test {
	const signature = h.stripe.webhooks.generateTestHeaderString({
		payload: signedBody,
		secret: WEBHOOK_SECRET,
	})
	return request(h.app.getHttpServer())
		.post('/webhooks/stripe')
		.set('Content-Type', 'application/json')
		.set('Stripe-Signature', signature)
		.send(body)
}

export async function statusOf(h: Harness, orderId: string): Promise<string> {
	const order = await h.prisma.order.findUniqueOrThrow({
		where: { id: orderId },
	})
	return order.status
}

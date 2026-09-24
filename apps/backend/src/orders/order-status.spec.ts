import { allowedFrom, canMove } from './order-status'

describe('order status', () => {
	it('moves forward from pending', () => {
		expect(canMove('pending', 'processing')).toBe(true)
		expect(canMove('pending', 'paid')).toBe(true)
		expect(canMove('pending', 'expired')).toBe(true)
	})

	it('settles processing into paid or failed only', () => {
		expect(canMove('processing', 'paid')).toBe(true)
		expect(canMove('processing', 'failed')).toBe(true)
		expect(canMove('processing', 'expired')).toBe(false)
	})

	it('never leaves a final status', () => {
		for (const from of ['paid', 'failed', 'expired'] as const) {
			expect(canMove(from, 'processing')).toBe(false)
			expect(canMove(from, 'paid')).toBe(false)
		}
	})

	it('lists the sources of a move', () => {
		expect(allowedFrom('paid')).toEqual(['pending', 'processing'])
		expect(allowedFrom('processing')).toEqual(['pending'])
	})
})

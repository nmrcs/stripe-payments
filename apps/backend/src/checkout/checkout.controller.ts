import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import {
	CheckoutRequest,
	type CheckoutResponse,
} from '@stripe-payments/contracts'
import { CheckoutService } from './checkout.service'

@Controller('checkout')
export class CheckoutController {
	constructor(private readonly checkout: CheckoutService) {}

	@Post()
	create(@Body() body: unknown): Promise<CheckoutResponse> {
		const parsed = CheckoutRequest.safeParse(body)
		if (!parsed.success) throw new BadRequestException(parsed.error.issues)
		return this.checkout.create(parsed.data)
	}
}

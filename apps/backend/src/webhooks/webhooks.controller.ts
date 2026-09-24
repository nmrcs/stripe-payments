import {
	BadRequestException,
	Controller,
	Headers,
	HttpCode,
	Post,
	Req,
	type RawBodyRequest,
} from '@nestjs/common'
import type { Request } from 'express'
import { WebhooksService, type WebhookResult } from './webhooks.service'

@Controller('webhooks')
export class WebhooksController {
	constructor(private readonly webhooks: WebhooksService) {}

	@Post('stripe')
	@HttpCode(200)
	stripe(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature: string | undefined,
	): Promise<WebhookResult> {
		// req.body is already parsed JSON. Serializing it back does not give the
		// bytes Stripe signed, so only the raw body is passed on.
		if (!req.rawBody || !signature) {
			throw new BadRequestException('missing body or signature')
		}
		return this.webhooks.handle(req.rawBody, signature)
	}
}

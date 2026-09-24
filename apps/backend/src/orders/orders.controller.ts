import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import type { Order } from '@stripe-payments/contracts'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
	constructor(private readonly orders: OrdersService) {}

	@Get(':id')
	get(@Param('id', ParseUUIDPipe) id: string): Promise<Order> {
		return this.orders.get(id)
	}
}

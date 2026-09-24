import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import type { Product } from '@stripe-payments/contracts'
import { ProductsService } from './products.service'

@Controller('products')
export class ProductsController {
	constructor(private readonly products: ProductsService) {}

	@Get()
	list(): Promise<Product[]> {
		return this.products.list()
	}

	@Get(':id')
	get(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
		return this.products.get(id)
	}
}

import { Injectable, NotFoundException } from '@nestjs/common'
import type { Product } from '@stripe-payments/contracts'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductsService {
	constructor(private readonly prisma: PrismaService) {}

	list(): Promise<Product[]> {
		return this.prisma.product.findMany({ orderBy: { priceCents: 'asc' } })
	}

	async get(id: string): Promise<Product> {
		const product = await this.prisma.product.findUnique({ where: { id } })
		if (!product) throw new NotFoundException('product not found')
		return product
	}
}

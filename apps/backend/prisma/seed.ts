import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const products = [
	{
		slug: 'field-notebook',
		name: 'Field Notebook',
		description: 'Dot grid, 96 pages, fits a back pocket.',
		priceCents: 1200,
	},
	{
		slug: 'enamel-mug',
		name: 'Enamel Mug',
		description: 'Steel with an enamel coat, 350 ml.',
		priceCents: 1800,
	},
	{
		slug: 'canvas-tote',
		name: 'Canvas Tote',
		description: 'Heavy cotton canvas, carries a laptop.',
		priceCents: 2400,
	},
]

async function main(): Promise<void> {
	const prisma = new PrismaClient({
		adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
	})
	for (const p of products) {
		await prisma.product.upsert({
			where: { slug: p.slug },
			update: p,
			create: { ...p, currency: 'usd', imageUrl: `/products/${p.slug}.svg` },
		})
	}
	await prisma.$disconnect()
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})

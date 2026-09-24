import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { ReconcileService } from './reconcile.service'

@Module({
	controllers: [OrdersController],
	providers: [OrdersService, ReconcileService],
	exports: [OrdersService],
})
export class OrdersModule {}

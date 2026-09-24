import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import type { Env } from './config/env'

async function bootstrap(): Promise<void> {
	// rawBody keeps the exact bytes of every request next to the parsed JSON.
	// The webhook signature is computed over those bytes.
	const app = await NestFactory.create(AppModule, { rawBody: true })
	const config = app.get(ConfigService<Env, true>)
	app.enableCors({ origin: [config.get('FRONTEND_ORIGIN', { infer: true })] })

	const port = config.get('PORT', { infer: true })
	await app.listen(port)
	new Logger('Bootstrap').log({
		actionCode: 'app.bootstrap.listen.ready',
		port,
	})
}

void bootstrap()

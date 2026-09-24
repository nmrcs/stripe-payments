import { execSync } from 'node:child_process'
import { Client } from 'pg'

const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	'postgresql://shop:shop@localhost:5434/stripe_payments_test'

// Creates the test database next to the development one if it is missing,
// then brings it to the current schema. Runs once per test run.
export default async function globalSetup(): Promise<void> {
	const url = new URL(TEST_DATABASE_URL)
	const name = url.pathname.slice(1)
	url.pathname = '/postgres'

	const client = new Client({ connectionString: url.toString() })
	await client.connect()
	const { rowCount } = await client.query(
		'SELECT 1 FROM pg_database WHERE datname = $1',
		[name],
	)
	if (!rowCount) await client.query(`CREATE DATABASE "${name}"`)
	await client.end()

	execSync('npx prisma migrate deploy', {
		stdio: 'inherit',
		env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
	})
}

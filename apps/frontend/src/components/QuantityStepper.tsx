import { NumberField } from '@heroui/react'
import { MAX_QUANTITY, useCart } from '../store/cart'

// The same control in the product card and in the cart. Going down to 0
// removes the product from the cart.
export function QuantityStepper({
	productId,
	name,
	size = 'md',
	variant,
}: {
	productId: string
	name: string
	size?: 'sm' | 'md'
	variant?: 'primary' | 'secondary'
}) {
	const quantity = useCart((s) => s.quantityOf(productId))
	const setQuantity = useCart((s) => s.setQuantity)
	return (
		<NumberField
			aria-label={`Quantity of ${name}`}
			value={quantity}
			minValue={0}
			maxValue={MAX_QUANTITY}
			variant={variant}
			onChange={(q) => setQuantity(productId, q)}
			className={size === 'sm' ? 'w-28' : 'w-32'}
		>
			<NumberField.Group>
				<NumberField.DecrementButton />
				<NumberField.Input className="text-center" />
				<NumberField.IncrementButton />
			</NumberField.Group>
		</NumberField>
	)
}

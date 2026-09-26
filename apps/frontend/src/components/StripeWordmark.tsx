// Stripe's official wordmark, drawn in the button's text colour through a
// mask: black on the white pay button. Stripe's brand assets allow the
// wordmark in black or white on checkout pages.
export function StripeWordmark({ className = '' }: { className?: string }) {
	return (
		<span
			role="img"
			aria-label="Stripe"
			className={`inline-block aspect-[360/151] shrink-0 bg-current ${className}`}
			style={{
				mask: 'url(/stripe-wordmark-white.svg) center / contain no-repeat',
				WebkitMask:
					'url(/stripe-wordmark-white.svg) center / contain no-repeat',
			}}
		/>
	)
}

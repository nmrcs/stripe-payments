import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			width="1em"
			height="1em"
			{...props}
		>
			{children}
		</svg>
	)
}

export const BagIcon = (p: IconProps) => (
	<Icon {...p}>
		<path d="M5 8h14l-1 12H6L5 8Z" />
		<path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
	</Icon>
)

export const TrashIcon = (p: IconProps) => (
	<Icon {...p}>
		<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 12.5h9l1-12.5M9.5 7V4.5h5V7" />
	</Icon>
)

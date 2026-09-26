// The product drawing on a studio-grey backdrop, the same in the grid and in
// the cart. The drawing is absolute, so its own 400px width never sizes the
// box: the box takes its size from the layout.
export function ProductImage({
	src,
	className = '',
}: {
	src: string
	className?: string
}) {
	return (
		<div
			className={`relative overflow-hidden bg-surface-secondary ${className}`}
		>
			<img
				src={src}
				alt=""
				className="absolute inset-0 size-full object-contain p-[14%]"
				draggable={false}
			/>
		</div>
	)
}

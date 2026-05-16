/**
 * Sidebar nav “needs attention” dot: inline when expanded, corner when icon-collapsed.
 */
export function NavBadgeDot({ label }: { label: string }) {
	return (
		<>
			<span
				className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary group-data-[collapsible=icon]:hidden"
				aria-hidden
			/>
			<span
				className="pointer-events-none absolute right-0.5 top-0.5 hidden h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar group-data-[collapsible=icon]:block"
				aria-hidden
			/>
			<span className="sr-only">{label}</span>
		</>
	);
}

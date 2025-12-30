import * as React from "react";

// Minimal Next.js <Link> mock for Storybook.
export default function Link({
	href,
	children,
	...props
}: React.PropsWithChildren<
	React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>) {
	return (
		<a href={href} {...props}>
			{children}
		</a>
	);
}

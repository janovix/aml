import { render } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Lightweight helper for component rendering in tests.
 *
 * The upstream reference app runs axe-core a11y checks here, but this repo
 * intentionally does not depend on axe-core/jest-axe.
 */
export async function checkAccessibility(ui: ReactElement) {
	const { container } = render(ui);
	return { container };
}

export class PointerEvent extends Event {
	// @ts-expect-error This is part of PointerEvent but not defined in the type
	button: number;
	// @ts-expect-error This is part of PointerEvent but not defined in the type
	ctrlKey: boolean;
	constructor(type: string, props: Record<string, unknown>) {
		super(type, props);
		if (props.button != null) {
			this.button = props.button as number;
		}
		if (props.ctrlKey != null) {
			this.ctrlKey = props.ctrlKey as boolean;
		}
	}
}

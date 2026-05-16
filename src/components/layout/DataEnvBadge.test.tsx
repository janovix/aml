import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { DataEnvBadge } from "./DataEnvBadge";
import { environmentAtom } from "@/lib/environment-store";

vi.mock("@algenium/blocks", () => ({
	EnvironmentMiniBadge: ({
		environment,
		abbreviated,
	}: {
		environment?: string;
		abbreviated?: boolean;
	}) => (
		<span
			data-testid="env-mini-badge"
			data-environment={environment}
			data-abbreviated={String(abbreviated)}
		>
			{environment === "staging"
				? "Stg"
				: environment === "development"
					? "Dev"
					: environment}
		</span>
	),
}));

describe("DataEnvBadge", () => {
	beforeEach(() => {
		environmentAtom.set("production");
	});

	afterEach(() => {
		cleanup();
		environmentAtom.set("production");
	});

	it("renders nothing when data environment is production", () => {
		environmentAtom.set("production");
		const { container } = render(<DataEnvBadge />);
		expect(container.firstChild).toBeNull();
	});

	it("renders abbreviated staging badge", () => {
		environmentAtom.set("staging");
		const { getByTestId } = render(<DataEnvBadge />);
		const badge = getByTestId("env-mini-badge");
		expect(badge).toHaveTextContent("Stg");
		expect(badge).toHaveAttribute("data-environment", "staging");
		expect(badge).toHaveAttribute("data-abbreviated", "true");
	});

	it("renders abbreviated development badge", () => {
		environmentAtom.set("development");
		const { getByTestId } = render(<DataEnvBadge />);
		const badge = getByTestId("env-mini-badge");
		expect(badge).toHaveTextContent("Dev");
		expect(badge).toHaveAttribute("data-environment", "development");
	});
});

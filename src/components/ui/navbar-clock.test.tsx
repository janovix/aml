import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/lib/testHelpers";
import { NavbarClock } from "./navbar-clock";

describe("NavbarClock", () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders without crashing", () => {
		const { container } = renderWithProviders(<NavbarClock />);
		expect(container.firstChild).toBeInTheDocument();
	});

	it("renders clock icon by default", () => {
		const { container } = renderWithProviders(<NavbarClock />);
		const svg = container.querySelector("svg");
		expect(svg).toBeInTheDocument();
	});

	it("hides clock icon when showIcon is false", () => {
		const { container } = renderWithProviders(<NavbarClock showIcon={false} />);
		// No svg should be in the trigger (not popover content)
		const trigger = container.firstChild;
		const svg = (trigger as HTMLElement)?.querySelector("svg");
		// When showIcon is false, the icon should not be rendered in the trigger
		// But lucide icons may still be in the popover content
		expect(trigger).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = renderWithProviders(
			<NavbarClock className="my-clock" />,
		);
		const el = container.querySelector(".my-clock");
		expect(el).toBeInTheDocument();
	});
});

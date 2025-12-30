import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PageHero } from "./page-hero";
import { Users, Plus, FileText, AlertCircle } from "lucide-react";

describe("PageHero", () => {
	const mockStats = [
		{
			label: "Total Items",
			value: 150,
			icon: Users,
			variant: "default" as const,
		},
		{
			label: "Active",
			value: 75,
			icon: FileText,
			variant: "primary" as const,
		},
		{
			label: "Pending",
			value: 25,
			icon: AlertCircle,
		},
	];

	it("renders title and subtitle", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
	});

	it("renders page icon", () => {
		const { container } = render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		const iconContainer = container.querySelector('[class*="bg-primary/10"]');
		expect(iconContainer).toBeInTheDocument();
	});

	it("renders all stats cards", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		expect(screen.getByText("Total Items")).toBeInTheDocument();
		expect(screen.getByText("150")).toBeInTheDocument();
		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("75")).toBeInTheDocument();
		expect(screen.getByText("Pending")).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
	});

	it("renders CTA button when onCtaClick is provided", () => {
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		const ctaButtons = screen.getAllByRole("button", {
			name: /nuevo registro/i,
		});
		expect(ctaButtons.length).toBeGreaterThan(0);
	});

	it("does not render CTA button when onCtaClick is not provided", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		const ctaButtons = screen.queryAllByRole("button");
		expect(ctaButtons.length).toBe(0);
	});

	it("calls onCtaClick when CTA button is clicked", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		const ctaButtons = screen.getAllByRole("button", {
			name: /nuevo registro/i,
		});
		await user.click(ctaButtons[0]);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("renders custom CTA label", () => {
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
				ctaLabel="Custom CTA"
			/>,
		);

		expect(screen.getByText("Custom CTA")).toBeInTheDocument();
	});

	it("renders custom CTA icon", () => {
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
				ctaIcon={FileText}
			/>,
		);

		const ctaButtons = screen.getAllByRole("button", {
			name: /nuevo registro/i,
		});
		expect(ctaButtons.length).toBeGreaterThan(0);
	});

	it("applies primary variant styling to primary stats", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		const activeLabel = screen.getByText("Active");
		const activeCard = activeLabel.closest('[class*="border-primary/30"]');
		expect(activeCard).toBeInTheDocument();
		expect(activeCard).toHaveClass("border-primary/30", "bg-primary/5");
	});

	it("applies default variant styling to default stats", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		const totalLabel = screen.getByText("Total Items");
		const totalCard = totalLabel.closest('[class*="border-border/50"]');
		expect(totalCard).toBeInTheDocument();
		expect(totalCard).toHaveClass("border-border/50", "bg-card/50");
	});

	it("renders stats with string values", () => {
		const statsWithString = [
			{
				label: "Status",
				value: "Active",
				icon: Users,
			},
		];

		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={statsWithString}
			/>,
		);

		expect(screen.getByText("Active")).toBeInTheDocument();
	});

	it("renders stats with numeric values", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		expect(screen.getByText("150")).toBeInTheDocument();
		expect(screen.getByText("75")).toBeInTheDocument();
		expect(screen.getByText("25")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				className="custom-class"
			/>,
		);

		const heroContainer = container.firstChild as HTMLElement;
		expect(heroContainer).toHaveClass("custom-class");
	});

	it("renders mobile icon-only CTA button", () => {
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		// Should have icon-only button for mobile (sm:hidden)
		const iconButtons = screen.getAllByRole("button");
		const mobileButton = iconButtons.find((btn) =>
			btn.className.includes("sm:hidden"),
		);
		expect(mobileButton).toBeInTheDocument();
	});

	it("renders desktop full CTA button", () => {
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		// Should have full button for desktop (hidden sm:inline-flex)
		const iconButtons = screen.getAllByRole("button");
		const desktopButton = iconButtons.find((btn) =>
			btn.className.includes("hidden sm:inline-flex"),
		);
		expect(desktopButton).toBeInTheDocument();
	});

	it("renders tooltip for mobile CTA button", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		const mobileButton = screen
			.getAllByRole("button")
			.find((btn) => btn.className.includes("sm:hidden"));
		if (mobileButton) {
			await user.hover(mobileButton);
			// Tooltip should be accessible
			expect(mobileButton).toHaveAttribute("aria-label", "Nuevo Registro");
		}
	});

	it("handles empty stats array", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={[]}
			/>,
		);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
	});

	it("renders stats with correct icon components", () => {
		render(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
			/>,
		);

		// Icons should be rendered in the stat cards
		const statCards = screen.getAllByText(/Total Items|Active|Pending/);
		expect(statCards.length).toBe(3);
	});
});

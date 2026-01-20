import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PageHero } from "./page-hero";
import {
	Users,
	Plus,
	FileText,
	AlertCircle,
	Edit,
	Trash2,
	Save,
	ArrowLeft,
} from "lucide-react";
import { renderWithProviders } from "@/lib/testHelpers";

// Mock useIsMobile hook
vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: vi.fn(() => false), // Default to desktop
}));

// Import the mock so we can control it
import { useIsMobile } from "@/hooks/use-mobile";
const mockUseIsMobile = vi.mocked(useIsMobile);

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

	beforeEach(() => {
		mockUseIsMobile.mockReturnValue(false); // Reset to desktop
	});

	it("renders title and subtitle", () => {
		renderWithProviders(
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
		const { container } = renderWithProviders(
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
		renderWithProviders(
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

	it("renders CTA button when onCtaClick is provided (legacy)", () => {
		const handleClick = vi.fn();
		renderWithProviders(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		expect(screen.getByText("Nuevo Registro")).toBeInTheDocument();
	});

	it("does not render CTA button when onCtaClick is not provided", () => {
		renderWithProviders(
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

	it("calls onCtaClick when CTA button is clicked (legacy)", async () => {
		const user = userEvent.setup();
		const handleClick = vi.fn();
		renderWithProviders(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={mockStats}
				onCtaClick={handleClick}
			/>,
		);

		const ctaButton = screen.getByText("Nuevo Registro").closest("button");
		if (ctaButton) {
			await user.click(ctaButton);
			expect(handleClick).toHaveBeenCalledTimes(1);
		}
	});

	it("renders custom CTA label (legacy)", () => {
		const handleClick = vi.fn();
		renderWithProviders(
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

	it("applies primary variant styling to primary stats", () => {
		renderWithProviders(
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
		renderWithProviders(
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

		renderWithProviders(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={statsWithString}
			/>,
		);

		expect(screen.getByText("Active")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = renderWithProviders(
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

	it("handles empty stats array - does not render stats section", () => {
		const { container } = renderWithProviders(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={[]}
			/>,
		);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		// Stats grid should not be rendered
		const statsGrid = container.querySelector('[class*="grid-cols-1"]');
		expect(statsGrid).not.toBeInTheDocument();
	});

	it("renders maximum of 3 cards when more stats are provided", () => {
		const manyStats = [
			...mockStats,
			{
				label: "Fourth Stat",
				value: 100,
				icon: Users,
			},
			{
				label: "Fifth Stat",
				value: 200,
				icon: FileText,
			},
		];

		renderWithProviders(
			<PageHero
				title="Test Title"
				subtitle="Test Subtitle"
				icon={Users}
				stats={manyStats}
			/>,
		);

		expect(screen.getByText("Total Items")).toBeInTheDocument();
		expect(screen.getByText("Active")).toBeInTheDocument();
		expect(screen.getByText("Pending")).toBeInTheDocument();
		expect(screen.queryByText("Fourth Stat")).not.toBeInTheDocument();
		expect(screen.queryByText("Fifth Stat")).not.toBeInTheDocument();
	});

	// New tests for optional stats
	describe("optional stats", () => {
		it("renders without stats when stats prop is undefined", () => {
			const { container } = renderWithProviders(
				<PageHero title="Test Title" subtitle="Test Subtitle" icon={Users} />,
			);

			expect(screen.getByText("Test Title")).toBeInTheDocument();
			// Stats grid should not be rendered
			const statsGrid = container.querySelector('[class*="grid-cols-1"]');
			expect(statsGrid).not.toBeInTheDocument();
		});
	});

	// New tests for multiple actions
	describe("multiple actions", () => {
		it("renders single action on desktop", () => {
			const handleClick = vi.fn();
			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[{ label: "Create", icon: Plus, onClick: handleClick }]}
				/>,
			);

			expect(screen.getByText("Create")).toBeInTheDocument();
		});

		it("renders multiple actions on desktop", () => {
			const handleCreate = vi.fn();
			const handleEdit = vi.fn();
			const handleDelete = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[
						{ label: "Create", icon: Plus, onClick: handleCreate },
						{
							label: "Edit",
							icon: Edit,
							onClick: handleEdit,
							variant: "outline",
						},
						{
							label: "Delete",
							icon: Trash2,
							onClick: handleDelete,
							variant: "destructive",
						},
					]}
				/>,
			);

			expect(screen.getByText("Create")).toBeInTheDocument();
			expect(screen.getByText("Edit")).toBeInTheDocument();
			expect(screen.getByText("Delete")).toBeInTheDocument();
		});

		it("calls action onClick when clicked", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[{ label: "Save", icon: Save, onClick: handleClick }]}
				/>,
			);

			const saveButton = screen.getByText("Save").closest("button");
			if (saveButton) {
				await user.click(saveButton);
				expect(handleClick).toHaveBeenCalledTimes(1);
			}
		});

		it("disables action button when disabled is true", () => {
			const handleClick = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[
						{ label: "Save", icon: Save, onClick: handleClick, disabled: true },
					]}
				/>,
			);

			const saveButton = screen.getByText("Save").closest("button");
			expect(saveButton).toBeDisabled();
		});

		it("renders primary action as default variant", () => {
			const handleClick = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[{ label: "Primary Action", onClick: handleClick }]}
				/>,
			);

			const button = screen.getByText("Primary Action").closest("button");
			// Default variant should not have "outline" or "destructive" classes
			expect(button).not.toHaveClass("border-input");
		});

		it("renders secondary actions with correct variants", () => {
			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[
						{ label: "Primary", onClick: vi.fn() },
						{ label: "Outline", onClick: vi.fn(), variant: "outline" },
						{ label: "Destructive", onClick: vi.fn(), variant: "destructive" },
					]}
				/>,
			);

			expect(screen.getByText("Outline")).toBeInTheDocument();
			expect(screen.getByText("Destructive")).toBeInTheDocument();
		});
	});

	// New tests for back button
	describe("back button", () => {
		it("renders back button when backButton prop is provided", () => {
			const handleBack = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					backButton={{ onClick: handleBack }}
				/>,
			);

			const backButton = screen.getByLabelText("Volver");
			expect(backButton).toBeInTheDocument();
		});

		it("renders back button with custom label", () => {
			const handleBack = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					backButton={{ label: "Go Back", onClick: handleBack }}
				/>,
			);

			const backButton = screen.getByLabelText("Go Back");
			expect(backButton).toBeInTheDocument();
		});

		it("calls backButton onClick when clicked", async () => {
			const user = userEvent.setup();
			const handleBack = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					backButton={{ onClick: handleBack }}
				/>,
			);

			const backButton = screen.getByLabelText("Volver");
			await user.click(backButton);

			expect(handleBack).toHaveBeenCalledTimes(1);
		});
	});

	// Backward compatibility tests
	describe("backward compatibility", () => {
		it("supports legacy onCtaClick with new actions behavior", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					stats={mockStats}
					onCtaClick={handleClick}
					ctaLabel="Legacy CTA"
					ctaIcon={Plus}
				/>,
			);

			const button = screen.getByText("Legacy CTA").closest("button");
			if (button) {
				await user.click(button);
				expect(handleClick).toHaveBeenCalledTimes(1);
			}
		});

		it("prefers actions over legacy onCtaClick when both provided", () => {
			const handleLegacy = vi.fn();
			const handleAction = vi.fn();

			renderWithProviders(
				<PageHero
					title="Test Title"
					subtitle="Test Subtitle"
					icon={Users}
					actions={[{ label: "New Action", onClick: handleAction }]}
					onCtaClick={handleLegacy}
					ctaLabel="Legacy CTA"
				/>,
			);

			// New action should be rendered, not legacy
			expect(screen.getByText("New Action")).toBeInTheDocument();
			expect(screen.queryByText("Legacy CTA")).not.toBeInTheDocument();
		});
	});
});

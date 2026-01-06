import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
	PieChart,
	DonutChart,
	BarChart,
	LineChart,
	MetricCard,
	SEVERITY_COLORS,
	STATUS_COLORS,
} from "./ReportCharts";

describe("ReportCharts", () => {
	describe("PieChart", () => {
		const mockData = [
			{ label: "Low", value: 10, color: "#6b7280" },
			{ label: "Medium", value: 20, color: "#f59e0b" },
			{ label: "High", value: 30, color: "#f97316" },
		];

		it("renders with data", () => {
			render(<PieChart data={mockData} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("renders with title", () => {
			render(<PieChart data={mockData} title="Severity Distribution" />);
			expect(screen.getByText("Severity Distribution")).toBeInTheDocument();
		});

		it("renders legend when showLegend is true", () => {
			render(<PieChart data={mockData} showLegend={true} />);
			expect(screen.getByText("Low")).toBeInTheDocument();
			expect(screen.getByText("Medium")).toBeInTheDocument();
			expect(screen.getByText("High")).toBeInTheDocument();
		});

		it("does not render legend when showLegend is false", () => {
			render(<PieChart data={mockData} showLegend={false} />);
			// Legend container should not be rendered when showLegend is false
			const legendContainer = document.querySelector(".flex.flex-wrap.gap-3");
			expect(legendContainer).not.toBeInTheDocument();
		});

		it("handles empty data", () => {
			render(<PieChart data={[]} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("handles zero total", () => {
			const zeroData = [
				{ label: "A", value: 0 },
				{ label: "B", value: 0 },
			];
			render(<PieChart data={zeroData} showLegend={true} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("applies custom dimensions", () => {
			render(<PieChart data={mockData} width={300} height={300} />);
			const svg = document.querySelector("svg");
			expect(svg).toHaveAttribute("width", "300");
			expect(svg).toHaveAttribute("height", "300");
		});

		it("uses default colors when not specified", () => {
			const dataWithoutColors = [
				{ label: "A", value: 10 },
				{ label: "B", value: 20 },
			];
			render(<PieChart data={dataWithoutColors} showLegend={true} />);
			expect(screen.getByText("A")).toBeInTheDocument();
		});
	});

	describe("DonutChart", () => {
		const mockData = [
			{ label: "Critical", value: 5, color: "#ef4444" },
			{ label: "High", value: 10, color: "#f97316" },
		];

		it("renders with data", () => {
			render(<DonutChart data={mockData} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("renders center label when provided", () => {
			render(
				<DonutChart data={mockData} centerLabel="Total" centerValue="15" />,
			);
			expect(screen.getByText("Total")).toBeInTheDocument();
			expect(screen.getByText("15")).toBeInTheDocument();
		});

		it("handles empty data", () => {
			render(<DonutChart data={[]} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});
	});

	describe("BarChart", () => {
		const mockData = [
			{ label: "Jan", value: 100 },
			{ label: "Feb", value: 150 },
			{ label: "Mar", value: 200 },
		];

		it("renders with data", () => {
			render(<BarChart data={mockData} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("renders with title", () => {
			render(<BarChart data={mockData} title="Monthly Alerts" />);
			expect(screen.getByText("Monthly Alerts")).toBeInTheDocument();
		});

		it("renders labels on x-axis", () => {
			render(<BarChart data={mockData} />);
			expect(screen.getByText("Jan")).toBeInTheDocument();
			expect(screen.getByText("Feb")).toBeInTheDocument();
			expect(screen.getByText("Mar")).toBeInTheDocument();
		});

		it("handles empty data", () => {
			render(<BarChart data={[]} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("handles single data point", () => {
			render(<BarChart data={[{ label: "Only", value: 50 }]} />);
			expect(screen.getByText("Only")).toBeInTheDocument();
		});

		it("applies custom dimensions", () => {
			render(<BarChart data={mockData} width={400} height={300} />);
			const svg = document.querySelector("svg");
			expect(svg).toHaveAttribute("width", "400");
			expect(svg).toHaveAttribute("height", "300");
		});

		it("shows values when showValues is true", () => {
			render(<BarChart data={mockData} showValues={true} />);
			expect(screen.getByText("100")).toBeInTheDocument();
		});

		it("renders horizontal layout", () => {
			render(<BarChart data={mockData} horizontal={true} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});
	});

	describe("LineChart", () => {
		const mockData = [
			{ date: "2024-01", value: 100 },
			{ date: "2024-02", value: 150 },
			{ date: "2024-03", value: 120 },
		];

		it("renders with data", () => {
			render(<LineChart data={mockData} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("renders with title", () => {
			render(<LineChart data={mockData} title="Trend Analysis" />);
			expect(screen.getByText("Trend Analysis")).toBeInTheDocument();
		});

		it("handles empty data", () => {
			render(<LineChart data={[]} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("handles single data point", () => {
			render(<LineChart data={[{ date: "2024-01", value: 100 }]} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("applies custom dimensions", () => {
			render(<LineChart data={mockData} width={500} height={400} />);
			const svg = document.querySelector("svg");
			expect(svg).toHaveAttribute("width", "500");
			expect(svg).toHaveAttribute("height", "400");
		});

		it("shows fill area when showArea is true", () => {
			render(<LineChart data={mockData} showArea={true} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});

		it("shows points when showPoints is true", () => {
			render(<LineChart data={mockData} showPoints={true} />);
			const svg = document.querySelector("svg");
			expect(svg).toBeInTheDocument();
		});
	});

	describe("MetricCard", () => {
		it("renders with label and value", () => {
			render(<MetricCard label="Total Alerts" value={150} />);
			expect(screen.getByText("Total Alerts")).toBeInTheDocument();
			expect(screen.getByText("150")).toBeInTheDocument();
		});

		it("renders with positive change indicator", () => {
			render(<MetricCard label="Total Alerts" value={150} change={12} />);
			expect(screen.getByText("↑ 12%")).toBeInTheDocument();
		});

		it("renders with negative change indicator", () => {
			render(<MetricCard label="Total Alerts" value={150} change={-8} />);
			expect(screen.getByText("↓ 8%")).toBeInTheDocument();
		});

		it("renders with zero change indicator", () => {
			render(<MetricCard label="Total Alerts" value={150} change={0} />);
			expect(screen.getByText("→ 0%")).toBeInTheDocument();
		});

		it("renders with icon", () => {
			render(
				<MetricCard
					label="Total Alerts"
					value={150}
					icon={<span data-testid="test-icon">🔔</span>}
				/>,
			);
			expect(screen.getByTestId("test-icon")).toBeInTheDocument();
		});

		it("renders string value", () => {
			render(<MetricCard label="Status" value="Active" />);
			expect(screen.getByText("Active")).toBeInTheDocument();
		});
	});

	describe("Color Constants", () => {
		it("SEVERITY_COLORS has correct values", () => {
			expect(SEVERITY_COLORS.LOW).toBe("#6b7280");
			expect(SEVERITY_COLORS.MEDIUM).toBe("#f59e0b");
			expect(SEVERITY_COLORS.HIGH).toBe("#f97316");
			expect(SEVERITY_COLORS.CRITICAL).toBe("#ef4444");
		});

		it("STATUS_COLORS has correct values", () => {
			expect(STATUS_COLORS.DETECTED).toBe("#3b82f6");
			expect(STATUS_COLORS.FILE_GENERATED).toBe("#06b6d4");
			expect(STATUS_COLORS.SUBMITTED).toBe("#8b5cf6");
			expect(STATUS_COLORS.OVERDUE).toBe("#ef4444");
			expect(STATUS_COLORS.CANCELLED).toBe("#6b7280");
		});
	});
});

import type { Meta, StoryObj } from "@storybook/react";
import { AlertsFilters } from "../../components/alerts/AlertsFilters";
import { useState } from "react";

const meta = {
	title: "Components/AlertsFilters",
	component: AlertsFilters,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AlertsFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

const AlertsFiltersWrapper = (args: Parameters<typeof AlertsFilters>[0]) => {
	const [searchQuery, setSearchQuery] = useState(args.searchQuery || "");
	const [statusFilter, setStatusFilter] = useState(args.statusFilter || "");
	const [severityFilter, setSeverityFilter] = useState(
		args.severityFilter || "",
	);
	const [sourceFilter, setSourceFilter] = useState(args.sourceFilter || "");
	const [activeFilters, setActiveFilters] = useState(args.activeFilters || []);

	return (
		<AlertsFilters
			{...args}
			searchQuery={searchQuery}
			onSearchChange={setSearchQuery}
			statusFilter={statusFilter}
			onStatusChange={setStatusFilter}
			severityFilter={severityFilter}
			onSeverityChange={setSeverityFilter}
			sourceFilter={sourceFilter}
			onSourceChange={setSourceFilter}
			activeFilters={activeFilters}
			onApplyFilters={() => {
				const filters: string[] = [];
				if (searchQuery) filters.push(`Búsqueda: "${searchQuery}"`);
				if (statusFilter) filters.push(`Estado: ${statusFilter}`);
				if (severityFilter) filters.push(`Severidad: ${severityFilter}`);
				if (sourceFilter) filters.push(`Origen: ${sourceFilter}`);
				setActiveFilters(filters);
			}}
			onClearFilters={() => {
				setSearchQuery("");
				setStatusFilter("");
				setSeverityFilter("");
				setSourceFilter("");
				setActiveFilters([]);
			}}
			onRemoveFilter={(filter) => {
				setActiveFilters(activeFilters.filter((f) => f !== filter));
			}}
		/>
	);
};

export const Default: Story = {
	render: AlertsFiltersWrapper,
	args: {
		searchQuery: "",
		statusFilter: "",
		severityFilter: "",
		sourceFilter: "",
		activeFilters: [],
		onSearchChange: () => {},
		onStatusChange: () => {},
		onSeverityChange: () => {},
		onSourceChange: () => {},
		onApplyFilters: () => {},
		onClearFilters: () => {},
		onRemoveFilter: () => {},
	},
};

export const WithActiveFilters: Story = {
	render: AlertsFiltersWrapper,
	args: {
		searchQuery: "sospechosa",
		statusFilter: "pending",
		severityFilter: "high",
		sourceFilter: "",
		activeFilters: [
			'Búsqueda: "sospechosa"',
			"Estado: pending",
			"Severidad: high",
		],
		onSearchChange: () => {},
		onStatusChange: () => {},
		onSeverityChange: () => {},
		onSourceChange: () => {},
		onApplyFilters: () => {},
		onClearFilters: () => {},
		onRemoveFilter: () => {},
	},
};

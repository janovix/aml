import type { Meta, StoryObj } from "@storybook/react";
import { ClientsFilters } from "../../components/clients/ClientsFilters";

const meta = {
	title: "Clients/ClientsFilters",
	component: ClientsFilters,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	argTypes: {
		searchQuery: {
			control: "text",
			description: "Search query string",
		},
		riskFilter: {
			control: "select",
			options: ["", "Alto", "Medio", "Bajo", "all"],
			description: "Risk level filter",
		},
		statusFilter: {
			control: "select",
			options: ["", "Activo", "En Revisión", "Bloqueado", "all"],
			description: "Status filter",
		},
	},
} satisfies Meta<typeof ClientsFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = (): void => {};

export const Default: Story = {
	args: {
		searchQuery: "",
		onSearchChange: noop,
		riskFilter: "",
		onRiskChange: noop,
		statusFilter: "",
		onStatusChange: noop,
		activeFilters: [],
		onApplyFilters: noop,
		onClearFilters: noop,
		onRemoveFilter: noop,
	},
};

export const WithFilters: Story = {
	args: {
		searchQuery: "Empresas Globales",
		onSearchChange: noop,
		riskFilter: "Alto",
		onRiskChange: noop,
		statusFilter: "Activo",
		onStatusChange: noop,
		activeFilters: [],
		onApplyFilters: noop,
		onClearFilters: noop,
		onRemoveFilter: noop,
	},
};

export const WithActiveFilters: Story = {
	args: {
		searchQuery: "",
		onSearchChange: noop,
		riskFilter: "",
		onRiskChange: noop,
		statusFilter: "",
		onStatusChange: noop,
		activeFilters: ["Riesgo: Alto", "Estado: Activo", 'Búsqueda: "Empresas"'],
		onApplyFilters: noop,
		onClearFilters: noop,
		onRemoveFilter: noop,
	},
};

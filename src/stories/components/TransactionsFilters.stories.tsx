import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsFilters } from "../../components/transactions/TransactionsFilters";
import type { ListTransactionsOptions } from "../../lib/api/transactions";

const meta = {
	title: "Transactions/TransactionsFilters",
	component: TransactionsFilters,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TransactionsFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

const handleFiltersChange = (filters: ListTransactionsOptions): void => {
	console.log("Filters changed:", filters);
};

export const Default: Story = {
	args: {
		filters: {},
		onFiltersChange: handleFiltersChange,
	},
};

export const Mobile: Story = {
	args: {
		filters: {},
		onFiltersChange: handleFiltersChange,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

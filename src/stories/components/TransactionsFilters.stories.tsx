import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsFilters } from "../../components/transactions/TransactionsFilters";

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

export const Default: Story = {
	args: {},
};

export const Mobile: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

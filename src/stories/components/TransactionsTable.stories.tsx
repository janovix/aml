import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsTable } from "../../components/transactions/TransactionsTable";

const meta = {
	title: "Transactions/TransactionsTable",
	component: TransactionsTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TransactionsTable>;

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

export const Tablet: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

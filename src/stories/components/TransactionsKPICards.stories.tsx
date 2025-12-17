import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsKPICards } from "../../components/transactions/TransactionsKPICards";

const meta = {
	title: "Transactions/TransactionsKPICards",
	component: TransactionsKPICards,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TransactionsKPICards>;

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

import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsPageContent } from "../../components/transactions/TransactionsPageContent";

const meta = {
	title: "Views/TransactionsPageContent",
	component: TransactionsPageContent,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/transactions",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TransactionsPageContent>;

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

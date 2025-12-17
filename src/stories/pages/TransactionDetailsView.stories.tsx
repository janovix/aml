import type { Meta, StoryObj } from "@storybook/react";
import { TransactionDetailsView } from "../../components/transactions/TransactionDetailsView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/TransactionDetailsView",
	component: TransactionDetailsView,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/transactions/1",
			},
		},
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<DashboardShell>
				<Story />
			</DashboardShell>
		),
	],
} satisfies Meta<typeof TransactionDetailsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		transactionId: "1",
	},
};

export const Mobile: Story = {
	args: {
		transactionId: "1",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const Tablet: Story = {
	args: {
		transactionId: "1",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

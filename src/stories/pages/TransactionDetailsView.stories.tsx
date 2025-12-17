import type { Meta, StoryObj } from "@storybook/react";
import { TransactionDetailsView } from "../../components/transactions/TransactionDetailsView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/TransactionDetailsView",
	component: TransactionDetailsView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for displaying detailed information about a transaction. Shows transaction data, related client information, vehicle details, and transaction history. Includes navigation controls and action buttons for editing.",
			},
		},
		nextjs: {
			router: {
				pathname: "/transactions/1",
			},
		},
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<DashboardLayout>
				<Story />
			</DashboardLayout>
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

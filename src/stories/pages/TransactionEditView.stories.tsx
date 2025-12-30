import type { Meta, StoryObj } from "@storybook/react";
import { TransactionEditView } from "../../components/transactions/TransactionEditView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/TransactionEditView",
	component: TransactionEditView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for editing transaction information. Provides form fields for updating transaction data including vehicle details, client association, transaction amount, and status. Includes save and cancel actions.",
			},
		},
		nextjs: {
			router: {
				pathname: "/transactions/1/edit",
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
} satisfies Meta<typeof TransactionEditView>;

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

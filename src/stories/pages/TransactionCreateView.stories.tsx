import type { Meta, StoryObj } from "@storybook/react";
import { TransactionCreateView } from "../../components/transactions/TransactionCreateView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/TransactionCreateView",
	component: TransactionCreateView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for creating a new transaction. Provides form fields for entering transaction information including vehicle details, client selection, and payment methods. The transaction amount is automatically calculated from the payment methods. Includes create and cancel actions.",
			},
		},
		nextjs: {
			router: {
				pathname: "/transactions/new",
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
} satisfies Meta<typeof TransactionCreateView>;

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

import type { Meta, StoryObj } from "@storybook/react";
import { TransactionEditView } from "../../components/transactions/TransactionEditView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/TransactionEditView",
	component: TransactionEditView,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/transactions/1/edit",
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

import type { Meta, StoryObj } from "@storybook/react";
import { TransactionsPageContent } from "../../components/transactions/TransactionsPageContent";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

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
	decorators: [
		(Story) => (
			<DashboardLayout>
				<Story />
			</DashboardLayout>
		),
	],
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

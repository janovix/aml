import type { Meta, StoryObj } from "@storybook/react";
import { TransactionCreateView } from "../../components/transactions/TransactionCreateView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/TransactionCreateView",
	component: TransactionCreateView,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/transactions/new",
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

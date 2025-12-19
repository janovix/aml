import type { Meta, StoryObj } from "@storybook/react";
import { AlertsPageContent } from "../../components/alerts/AlertsPageContent";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/AlertsPageContent",
	component: AlertsPageContent,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/alertas",
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
} satisfies Meta<typeof AlertsPageContent>;

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

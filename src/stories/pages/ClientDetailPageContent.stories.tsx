import type { Meta, StoryObj } from "@storybook/react";
import { ClientDetailPageContent } from "../../components/clients/ClientDetailPageContent";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/ClientDetailPageContent",
	component: ClientDetailPageContent,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients/1",
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
} satisfies Meta<typeof ClientDetailPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		clientId: "1",
	},
};

export const Mobile: Story = {
	args: {
		clientId: "1",
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const Tablet: Story = {
	args: {
		clientId: "1",
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { ClientDetailsView } from "../../components/clients/ClientDetailsView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientDetailsView",
	component: ClientDetailsView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for displaying detailed information about a client. Shows client personal/business data, contact information, transaction history, and compliance notes. Includes navigation controls and action buttons for editing and generating reports.",
			},
		},
		nextjs: {
			router: {
				pathname: "/clients/1",
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
} satisfies Meta<typeof ClientDetailsView>;

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

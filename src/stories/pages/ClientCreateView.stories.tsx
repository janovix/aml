import type { Meta, StoryObj } from "@storybook/react";
import { ClientCreateView } from "../../components/clients/ClientCreateView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientCreateView",
	component: ClientCreateView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for creating a new client. Provides form fields for entering client information including business details, risk assessment, contact information, and compliance notes. Includes create and cancel actions.",
			},
		},
		nextjs: {
			router: {
				pathname: "/clients/new",
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
} satisfies Meta<typeof ClientCreateView>;

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

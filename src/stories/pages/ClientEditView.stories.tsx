import type { Meta, StoryObj } from "@storybook/react";
import { ClientEditView } from "../../components/clients/ClientEditView";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientEditView",
	component: ClientEditView,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients/1/edit",
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
} satisfies Meta<typeof ClientEditView>;

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

import type { Meta, StoryObj } from "@storybook/react";
import { ClientEditPageContent } from "../../components/clients/ClientEditPageContent";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientEditPageContent",
	component: ClientEditPageContent,
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
} satisfies Meta<typeof ClientEditPageContent>;

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

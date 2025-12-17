import type { Meta, StoryObj } from "@storybook/react";
import { ClientsPageContent } from "../../components/clients/ClientsPageContent";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientsPageContent",
	component: ClientsPageContent,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients",
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
} satisfies Meta<typeof ClientsPageContent>;

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

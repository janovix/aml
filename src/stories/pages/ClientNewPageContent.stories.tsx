import type { Meta, StoryObj } from "@storybook/react";
import { ClientNewPageContent } from "../../components/clients/ClientNewPageContent";
import { DashboardShell } from "../../components/layout/DashboardShell";

const meta = {
	title: "Views/ClientNewPageContent",
	component: ClientNewPageContent,
	parameters: {
		layout: "fullscreen",
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
} satisfies Meta<typeof ClientNewPageContent>;

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

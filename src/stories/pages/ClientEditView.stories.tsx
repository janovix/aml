import type { Meta, StoryObj } from "@storybook/react";
import { ClientEditView } from "../../components/clients/ClientEditView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/ClientEditView",
	component: ClientEditView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for editing client information. Provides form fields for updating client data including business details, risk assessment, contact information, and compliance notes. Includes save and cancel actions.",
			},
		},
		nextjs: {
			router: {
				pathname: "/clients/1/edit",
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

import type { Meta, StoryObj } from "@storybook/react";
import { ClientCreateView } from "../../components/clients/ClientCreateView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/ClientCreateView",
	component: ClientCreateView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for creating a new client. Provides form fields for entering client information including person type (physical, moral, trust), business details, contact information, address, and compliance notes. Includes session storage for form persistence and validation for RFC, CURP, and phone. Includes create and cancel actions.",
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
			<DashboardLayout>
				<Story />
			</DashboardLayout>
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

export const Desktop: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
	},
};

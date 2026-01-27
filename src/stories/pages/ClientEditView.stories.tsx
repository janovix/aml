import type { Meta, StoryObj } from "@storybook/react";
import {
	ClientEditView,
	ClientEditSkeleton,
} from "../../components/clients/ClientEditView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/ClientEditView",
	component: ClientEditView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for editing client information. Provides form fields for updating client data including person type (locked), business details, contact information, address, and compliance notes. Person type and RFC are locked and cannot be modified. Includes loading skeleton, save and cancel actions.",
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

export const Loading: Story = {
	args: {
		clientId: "1",
	},
	render: () => (
		<DashboardLayout>
			<ClientEditSkeleton />
		</DashboardLayout>
	),
	parameters: {
		docs: {
			description: {
				story: "Loading state skeleton shown while fetching client data.",
			},
		},
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

export const Desktop: Story = {
	args: {
		clientId: "1",
	},
	parameters: {
		viewport: {
			defaultViewport: "desktop",
		},
	},
};

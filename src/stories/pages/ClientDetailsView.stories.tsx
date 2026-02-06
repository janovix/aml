import type { Meta, StoryObj } from "@storybook/react";
import {
	ClientDetailsView,
	ClientDetailsSkeleton,
} from "../../components/clients/ClientDetailsView";
import { DashboardLayout } from "../../components/layout/DashboardLayout";

const meta = {
	title: "Views/ClientDetailsView",
	component: ClientDetailsView,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"View component for displaying detailed information about a client. Shows client personal/business data (with person type styling), contact information, operation history dates, and compliance notes. Includes loading skeleton, navigation controls, and action buttons for editing, generating reports, and marking as suspicious.",
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
			<DashboardLayout>
				<Story />
			</DashboardLayout>
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

export const Loading: Story = {
	args: {
		clientId: "1",
	},
	render: () => (
		<DashboardLayout>
			<ClientDetailsSkeleton />
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

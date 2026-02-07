import type { Meta, StoryObj } from "@storybook/react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { ClientsPageContent } from "../../components/clients/ClientsPageContent";

const meta = {
	title: "Layout/DashboardLayout",
	component: DashboardLayout,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DashboardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: <ClientsPageContent />,
	},
};

export const Collapsed: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		// Simulate collapsed sidebar by setting cookie
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Mobile: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Tablet: Story = {
	args: {
		children: <ClientsPageContent />,
	},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const WithOperations: Story = {
	args: {
		children: (
			<div className="space-y-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Transacciones</h1>
					<p className="text-muted-foreground">
						Gestión de transacciones de vehículos
					</p>
				</div>
			</div>
		),
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/operations",
			},
		},
	},
};

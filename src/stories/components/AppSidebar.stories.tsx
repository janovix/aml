import type { Meta, StoryObj, Decorator } from "@storybook/react";
import { AppSidebar } from "../../components/layout/AppSidebar";
import { SidebarProvider } from "../../components/ui/sidebar";

const AppSidebarDecorator: Decorator = (Story) => {
	return (
		<SidebarProvider defaultOpen={true}>
			<div className="h-screen">
				<Story />
			</div>
		</SidebarProvider>
	);
};

const meta = {
	title: "Layout/AppSidebar",
	component: AppSidebar,
	decorators: [AppSidebarDecorator],
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Note: AppSidebar uses hooks like useAuthSession, useOrgStore, usePathname, etc.
// These are mocked via Storybook's Next.js integration and the mocks in .storybook/mocks/
// The component will use the actual implementations which may require proper setup
// in a real application context.

export const Default: Story = {
	args: {},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Collapsed: Story = {
	decorators: [
		(Story) => (
			<SidebarProvider defaultOpen={false}>
				<div className="h-screen">
					<Story />
				</div>
			</SidebarProvider>
		),
	],
	args: {},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const WithUser: Story = {
	args: {},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Loading: Story = {
	args: {},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const NoOrganizations: Story = {
	args: {},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

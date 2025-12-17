import type { Meta, StoryObj } from "@storybook/react";
import { AppSidebar } from "../../components/layout/AppSidebar";

/**
 * @deprecated This component is deprecated. Use DashboardLayout instead.
 * This story is kept for reference only.
 */
const meta = {
	title: "Layout/AppSidebar (Deprecated)",
	component: AppSidebar,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs", "deprecated"],
	argTypes: {
		collapsed: {
			control: "boolean",
			description: "Whether the sidebar is collapsed",
		},
		isMobile: {
			control: "boolean",
			description: "Whether to render the mobile version",
		},
		onToggle: {
			action: "toggled",
			description: "Callback when sidebar is toggled",
		},
	},
} satisfies Meta<typeof AppSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		collapsed: false,
		isMobile: false,
		onToggle: () => {},
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Collapsed: Story = {
	args: {
		collapsed: true,
		isMobile: false,
		onToggle: () => {},
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/clients",
			},
		},
	},
};

export const Mobile: Story = {
	args: {
		collapsed: false,
		isMobile: true,
		onToggle: () => {},
	},
	parameters: {
		nextjs: {
			router: {
				pathname: "/transactions",
			},
		},
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

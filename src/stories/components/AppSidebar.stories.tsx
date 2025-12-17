import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const meta: Meta<typeof AppSidebar> = {
	title: "Components/AppSidebar",
	component: AppSidebar,
	decorators: [
		(Story) => (
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				enableSystem={false}
			>
				<div className="flex h-screen w-64">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

export default meta;

type Story = StoryObj<typeof AppSidebar>;

export const Expanded: Story = {
	render: () => {
		const [collapsed, setCollapsed] = useState(false);
		return (
			<AppSidebar
				collapsed={collapsed}
				onToggle={() => setCollapsed(!collapsed)}
			/>
		);
	},
};

export const Collapsed: Story = {
	render: () => {
		const [collapsed, setCollapsed] = useState(true);
		return (
			<AppSidebar
				collapsed={collapsed}
				onToggle={() => setCollapsed(!collapsed)}
			/>
		);
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { AppSwitcher } from "@/components/layout/AppSwitcher";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
	SidebarProvider,
	Sidebar,
	SidebarContent,
} from "@/components/ui/sidebar";

const meta: Meta<typeof AppSwitcher> = {
	title: "Components/Layout/AppSwitcher",
	component: AppSwitcher,
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<LanguageProvider>
					<SidebarProvider defaultOpen={true}>
						<div className="flex min-h-[400px] w-full">
							<Sidebar>
								<SidebarContent className="p-2">
									<Story />
								</SidebarContent>
							</Sidebar>
							<div className="flex-1 p-4 bg-background">
								<p className="text-muted-foreground">Main content area</p>
							</div>
						</div>
					</SidebarProvider>
				</LanguageProvider>
			</ThemeProvider>
		),
	],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"App switcher dropdown component for switching between different Janovix applications (AML, Watchlist, Settings). Adapts to sidebar state (expanded/collapsed) and screen size.",
			},
		},
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["sidebar", "mobile-fullscreen"],
			description: "Variant for different contexts",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
};

export default meta;

type Story = StoryObj<typeof AppSwitcher>;

export const Default: Story = {
	args: {
		variant: "sidebar",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default sidebar variant showing the full logo with dropdown menu.",
			},
		},
	},
};

export const SidebarVariant: Story = {
	args: {
		variant: "sidebar",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Sidebar variant used in the expanded sidebar. Shows full logo with chevron indicator.",
			},
		},
	},
};

export const MobileFullscreen: Story = {
	args: {
		variant: "mobile-fullscreen",
	},
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<LanguageProvider>
					<div className="min-h-[400px] w-full bg-background/95 p-4">
						<Story />
					</div>
				</LanguageProvider>
			</ThemeProvider>
		),
	],
	parameters: {
		docs: {
			description: {
				story:
					"Mobile fullscreen variant with larger touch targets and enhanced styling for mobile sidebar overlay.",
			},
		},
	},
};

export const CollapsedSidebar: Story = {
	args: {
		variant: "sidebar",
	},
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<LanguageProvider>
					<SidebarProvider defaultOpen={false}>
						<div className="flex min-h-[400px] w-full">
							<Sidebar collapsible="icon">
								<SidebarContent className="p-2">
									<Story />
								</SidebarContent>
							</Sidebar>
							<div className="flex-1 p-4 bg-background">
								<p className="text-muted-foreground">Main content area</p>
							</div>
						</div>
					</SidebarProvider>
				</LanguageProvider>
			</ThemeProvider>
		),
	],
	parameters: {
		docs: {
			description: {
				story:
					"Sidebar variant when sidebar is collapsed. Shows only the icon with dropdown menu appearing to the right.",
			},
		},
	},
};

export const WithCustomClass: Story = {
	args: {
		variant: "sidebar",
		className: "bg-primary/5 rounded-lg",
	},
	parameters: {
		docs: {
			description: {
				story: "App switcher with custom className applied.",
			},
		},
	},
};

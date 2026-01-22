import type { Meta, StoryObj } from "@storybook/react";
import { ChatSidebar, NavbarChatButton } from "@/components/chat/ChatSidebar";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

// Mock providers wrapper for stories
function StorybookProviders({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<LanguageProvider>
				<ChatProvider>{children}</ChatProvider>
			</LanguageProvider>
		</ThemeProvider>
	);
}

// ChatSidebar Stories
const sidebarMeta: Meta<typeof ChatSidebar> = {
	title: "Components/Chat/ChatSidebar",
	component: ChatSidebar,
	decorators: [
		(Story) => (
			<StorybookProviders>
				<div className="flex h-screen w-full">
					<div className="flex-1 bg-muted/20 p-4">
						<p className="text-muted-foreground">Main content area</p>
					</div>
					<Story />
				</div>
			</StorybookProviders>
		),
	],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Chat sidebar component with multiple modes: sidebar (large screens), floating panel, and fullscreen overlay (small screens).",
			},
		},
	},
	argTypes: {
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
};

export default sidebarMeta;

type SidebarStory = StoryObj<typeof ChatSidebar>;

export const Default: SidebarStory = {
	parameters: {
		docs: {
			description: {
				story:
					"Default sidebar mode on large screens. Shows the sidebar panel with chat interface.",
			},
		},
	},
};

export const WithClassName: SidebarStory = {
	args: {
		className: "border-l-2 border-primary",
	},
	parameters: {
		docs: {
			description: {
				story: "Sidebar with custom className applied.",
			},
		},
	},
};

// NavbarChatButton Stories
const buttonMeta: Meta<typeof NavbarChatButton> = {
	title: "Components/Chat/NavbarChatButton",
	component: NavbarChatButton,
	decorators: [
		(Story) => (
			<StorybookProviders>
				<div className="flex h-16 items-center justify-end px-4 bg-background border-b">
					<Story />
				</div>
			</StorybookProviders>
		),
	],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Animated bot icon button for the navbar that toggles the chat sidebar. Shows different expressions based on chat state.",
			},
		},
	},
	argTypes: {
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
};

export const NavbarButton: StoryObj<typeof NavbarChatButton> = {
	render: () => <NavbarChatButton />,
	parameters: {
		docs: {
			description: {
				story:
					"Default state of the navbar chat button. Click to toggle the chat sidebar.",
			},
		},
	},
};

export const NavbarButtonWithClassName: StoryObj<typeof NavbarChatButton> = {
	render: () => <NavbarChatButton className="ring-2 ring-primary" />,
	parameters: {
		docs: {
			description: {
				story: "Navbar chat button with custom className applied.",
			},
		},
	},
};

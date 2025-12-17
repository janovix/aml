import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { ClientsPageContent } from "@/components/clients/ClientsPageContent";
import { ThemeProvider } from "@/components/ThemeProvider";

const withProviders: Decorator = (Story) => (
	<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
		<Story />
	</ThemeProvider>
);

const meta: Meta<typeof ClientsPageContent> = {
	title: "Pages/ClientsPageContent",
	component: ClientsPageContent,
	decorators: [withProviders],
	parameters: {
		layout: "fullscreen",
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/clients",
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof ClientsPageContent>;

export const Default: Story = {};

import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { TransactionsPageContent } from "@/components/transactions/TransactionsPageContent";
import { ThemeProvider } from "@/components/ThemeProvider";

const withProviders: Decorator = (Story) => (
	<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
		<Story />
	</ThemeProvider>
);

const meta: Meta<typeof TransactionsPageContent> = {
	title: "Pages/TransactionsPageContent",
	component: TransactionsPageContent,
	decorators: [withProviders],
	parameters: {
		layout: "fullscreen",
		nextjs: {
			appDirectory: true,
			navigation: {
				pathname: "/transactions",
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof TransactionsPageContent>;

export const Default: Story = {};

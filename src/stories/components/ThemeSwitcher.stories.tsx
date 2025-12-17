import type { Meta, StoryObj } from "@storybook/react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ThemeProvider } from "@/components/ThemeProvider";

const meta: Meta<typeof ThemeSwitcher> = {
	title: "Components/ThemeSwitcher",
	component: ThemeSwitcher,
	decorators: [
		(Story) => (
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				enableSystem={false}
			>
				<div className="p-4">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

export default meta;

type Story = StoryObj<typeof ThemeSwitcher>;

export const Default: Story = {};

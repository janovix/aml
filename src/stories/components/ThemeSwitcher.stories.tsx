import type { Meta, StoryObj } from "@storybook/react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ThemeProvider } from "@/components/ThemeProvider";

const meta: Meta<typeof ThemeSwitcher> = {
	title: "Components/ThemeSwitcher",
	component: ThemeSwitcher,
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<div className="p-4">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
	parameters: {
		docs: {
			description: {
				component:
					"A ternary theme switcher with system, light, and dark options. Uses animated transitions between states.",
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof ThemeSwitcher>;

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story: "Default theme switcher with system, light, and dark options.",
			},
		},
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const meta: Meta<typeof LanguageSwitcher> = {
	title: "Components/LanguageSwitcher",
	component: LanguageSwitcher,
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<LanguageProvider>
					<div className="p-8 flex items-center justify-center min-h-[200px]">
						<Story />
					</div>
				</LanguageProvider>
			</ThemeProvider>
		),
	],
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Language switcher component with segmented control and mini dropdown variants. Supports multiple sizes and shapes.",
			},
		},
	},
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
			description: "Size of the switcher",
		},
		shape: {
			control: "select",
			options: ["rounded", "squared", "pill"],
			description: "Shape of the button",
		},
		variant: {
			control: "select",
			options: ["default", "mini"],
			description: "Mini variant shows only an icon dropdown",
		},
		showIcon: {
			control: "boolean",
			description: "Show language icon in default variant",
		},
		align: {
			control: "select",
			options: ["start", "center", "end"],
			description: "Dropdown alignment",
		},
		side: {
			control: "select",
			options: ["top", "bottom", "left", "right"],
			description: "Dropdown side position",
		},
		className: {
			control: "text",
			description: "Additional CSS classes",
		},
	},
};

export default meta;

type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {
	args: {
		size: "sm",
		shape: "rounded",
		variant: "default",
		showIcon: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Default segmented control variant with language icon.",
			},
		},
	},
};

export const Mini: Story = {
	args: {
		variant: "mini",
		size: "md",
		shape: "rounded",
	},
	parameters: {
		docs: {
			description: {
				story: "Mini variant showing only an icon that opens a dropdown menu.",
			},
		},
	},
};

export const SizeSmall: Story = {
	args: {
		size: "sm",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Small size variant.",
			},
		},
	},
};

export const SizeMedium: Story = {
	args: {
		size: "md",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Medium size variant.",
			},
		},
	},
};

export const SizeLarge: Story = {
	args: {
		size: "lg",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Large size variant.",
			},
		},
	},
};

export const ShapeRounded: Story = {
	args: {
		shape: "rounded",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Rounded shape variant.",
			},
		},
	},
};

export const ShapeSquared: Story = {
	args: {
		shape: "squared",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Squared shape variant with minimal border radius.",
			},
		},
	},
};

export const ShapePill: Story = {
	args: {
		shape: "pill",
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Pill shape variant with fully rounded corners.",
			},
		},
	},
};

export const WithoutIcon: Story = {
	args: {
		showIcon: false,
		variant: "default",
	},
	parameters: {
		docs: {
			description: {
				story: "Default variant without the language icon.",
			},
		},
	},
};

export const DropdownPositionTop: Story = {
	args: {
		variant: "mini",
		side: "top",
		align: "center",
	},
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<LanguageProvider>
					<div className="p-8 flex items-end justify-center min-h-[200px]">
						<Story />
					</div>
				</LanguageProvider>
			</ThemeProvider>
		),
	],
	parameters: {
		docs: {
			description: {
				story: "Mini variant with dropdown positioned at the top.",
			},
		},
	},
};

export const DropdownPositionRight: Story = {
	args: {
		variant: "mini",
		side: "right",
		align: "start",
	},
	parameters: {
		docs: {
			description: {
				story: "Mini variant with dropdown positioned to the right.",
			},
		},
	},
};

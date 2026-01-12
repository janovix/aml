import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Download } from "lucide-react";

const meta: Meta<typeof Button> = {
	title: "UI/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
		},
		disabled: {
			control: "boolean",
		},
	},
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
	args: {
		children: "Button",
		variant: "default",
	},
};

export const Destructive: Story = {
	args: {
		children: "Delete",
		variant: "destructive",
	},
};

export const Outline: Story = {
	args: {
		children: "Outline",
		variant: "outline",
	},
};

export const Secondary: Story = {
	args: {
		children: "Secondary",
		variant: "secondary",
	},
};

export const Ghost: Story = {
	args: {
		children: "Ghost",
		variant: "ghost",
	},
};

export const Link: Story = {
	args: {
		children: "Link",
		variant: "link",
	},
};

export const Small: Story = {
	args: {
		children: "Small Button",
		size: "sm",
	},
};

export const Large: Story = {
	args: {
		children: "Large Button",
		size: "lg",
	},
};

export const WithIcon: Story = {
	args: {
		children: (
			<>
				<Plus className="h-4 w-4" />
				Add Item
			</>
		),
	},
};

export const IconButton: Story = {
	args: {
		size: "icon",
		children: <Trash2 className="h-4 w-4" />,
		"aria-label": "Delete",
	},
};

export const IconButtonSmall: Story = {
	args: {
		size: "icon-sm",
		children: <Download className="h-4 w-4" />,
		"aria-label": "Download",
	},
};

export const IconButtonLarge: Story = {
	args: {
		size: "icon-lg",
		children: <Plus className="h-4 w-4" />,
		"aria-label": "Add",
	},
};

export const Disabled: Story = {
	args: {
		children: "Disabled",
		disabled: true,
	},
};

export const DestructiveDisabled: Story = {
	args: {
		children: "Delete",
		variant: "destructive",
		disabled: true,
	},
};

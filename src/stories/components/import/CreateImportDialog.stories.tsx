import type { Meta, StoryObj } from "@storybook/react";
import { CreateImportDialog } from "@/components/import/CreateImportDialog";

const meta: Meta<typeof CreateImportDialog> = {
	title: "Components/Import/CreateImportDialog",
	component: CreateImportDialog,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CreateImportDialog>;

export const Open: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
		onSuccess: () => {},
	},
};

export const Closed: Story = {
	args: {
		open: false,
		onOpenChange: () => {},
		onSuccess: () => {},
	},
};

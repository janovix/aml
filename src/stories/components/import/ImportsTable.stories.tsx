import type { Meta, StoryObj } from "@storybook/react";
import { ImportsTable } from "@/components/import/ImportsTable";

const meta: Meta<typeof ImportsTable> = {
	title: "Components/Import/ImportsTable",
	component: ImportsTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ImportsTable>;

export const Default: Story = {
	args: {
		refreshTrigger: 0,
	},
};

export const WithRefreshTrigger: Story = {
	args: {
		refreshTrigger: 1,
	},
};

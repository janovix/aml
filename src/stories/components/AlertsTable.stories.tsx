import type { Meta, StoryObj } from "@storybook/react";
import { AlertsTable } from "../../components/alerts/AlertsTable";

const meta = {
	title: "Components/AlertsTable",
	component: AlertsTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AlertsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

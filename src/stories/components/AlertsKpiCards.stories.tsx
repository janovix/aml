import type { Meta, StoryObj } from "@storybook/react";
import { AlertsKpiCards } from "../../components/alerts/AlertsKpiCards";

const meta = {
	title: "Components/AlertsKpiCards",
	component: AlertsKpiCards,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AlertsKpiCards>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

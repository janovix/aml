import type { Meta, StoryObj } from "@storybook/react";
import { ClientsTable } from "../../components/clients/ClientsTable";

const meta = {
	title: "Clients/ClientsTable",
	component: ClientsTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ClientsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const Mobile: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const Tablet: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

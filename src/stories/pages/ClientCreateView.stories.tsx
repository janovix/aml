import type { Meta, StoryObj } from "@storybook/react";
import { ClientCreateView } from "../../components/clients/ClientCreateView";

const meta = {
	title: "Views/ClientCreateView",
	component: ClientCreateView,
	parameters: {
		layout: "fullscreen",
		nextjs: {
			router: {
				pathname: "/clients/new",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ClientCreateView>;

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

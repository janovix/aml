import type { Meta, StoryObj } from "@storybook/react";
import { NavUser } from "../../../components/layout/NavUser";
import { SidebarProvider } from "../../../components/ui/sidebar";

const meta = {
	title: "Layout/NavUser",
	component: NavUser,
	decorators: [
		(Story) => (
			<SidebarProvider defaultOpen={true}>
				<div className="w-64 p-4">
					<Story />
				</div>
			</SidebarProvider>
		),
	],
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		isLoading: {
			control: "boolean",
			description: "Whether the component is in a loading state",
		},
		user: {
			control: "object",
			description: "User object with name, email, and optional avatar",
		},
		onLogout: {
			action: "logout",
			description: "Callback when logout is clicked",
		},
	},
} satisfies Meta<typeof NavUser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
	args: {
		user: null,
		isLoading: true,
		onLogout: () => {},
	},
};

export const WithAvatar: Story = {
	args: {
		user: {
			name: "John Doe",
			email: "john.doe@example.com",
			avatar: "https://via.placeholder.com/32",
		},
		isLoading: false,
		onLogout: () => {},
	},
};

export const WithoutAvatar: Story = {
	args: {
		user: {
			name: "Jane Smith",
			email: "jane.smith@example.com",
		},
		isLoading: false,
		onLogout: () => {},
	},
};

export const Mobile: Story = {
	decorators: [
		(Story) => (
			<SidebarProvider defaultOpen={true}>
				<div className="w-64 p-4">
					<Story />
				</div>
			</SidebarProvider>
		),
	],
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
	args: {
		user: {
			name: "John Doe",
			email: "john.doe@example.com",
			avatar: "https://via.placeholder.com/32",
		},
		isLoading: false,
		onLogout: () => {},
	},
};

export const LongName: Story = {
	args: {
		user: {
			name: "Dr. Maria Elena Rodriguez de la Cruz",
			email: "maria.rodriguez@example.com",
			avatar: "https://via.placeholder.com/32",
		},
		isLoading: false,
		onLogout: () => {},
	},
};

export const LongEmail: Story = {
	args: {
		user: {
			name: "John Doe",
			email: "john.doe.very.long.email.address@example.com",
			avatar: "https://via.placeholder.com/32",
		},
		isLoading: false,
		onLogout: () => {},
	},
};

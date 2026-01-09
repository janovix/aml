import type { Meta, StoryObj } from "@storybook/react";
import {
	OrganizationSwitcher,
	type Organization,
} from "../../components/layout/OrganizationSwitcher";
import { SidebarProvider } from "../../components/ui/sidebar";

const mockOrganizations: Organization[] = [
	{
		id: "1",
		name: "Acme Corporation",
		slug: "acme-corp",
		logo: undefined,
	},
	{
		id: "2",
		name: "Tech Solutions Inc",
		slug: "tech-solutions",
		logo: "https://via.placeholder.com/32",
	},
	{
		id: "3",
		name: "Global Industries",
		slug: "global-industries",
		logo: undefined,
	},
];

const mockOrganizationsWithLogos: Organization[] = [
	{
		id: "1",
		name: "Acme Corporation",
		slug: "acme-corp",
		logo: "https://via.placeholder.com/32",
	},
	{
		id: "2",
		name: "Tech Solutions Inc",
		slug: "tech-solutions",
		logo: "https://via.placeholder.com/32",
	},
	{
		id: "3",
		name: "Global Industries",
		slug: "global-industries",
		logo: undefined,
	},
];

const meta = {
	title: "Layout/OrganizationSwitcher",
	component: OrganizationSwitcher,
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
		organizations: {
			control: "object",
			description: "Array of organizations",
		},
		activeOrganization: {
			control: "object",
			description: "Currently active organization",
		},
		onOrganizationChange: {
			action: "organization-changed",
			description: "Callback when organization is changed",
		},
		onCreateOrganization: {
			action: "create-organization",
			description: "Callback when create organization is clicked",
		},
	},
} satisfies Meta<typeof OrganizationSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
	args: {
		organizations: [],
		activeOrganization: null,
		onOrganizationChange: () => {},
		onCreateOrganization: () => {},
		isLoading: true,
	},
};

export const Collapsed: Story = {
	decorators: [
		(Story) => (
			<SidebarProvider defaultOpen={false}>
				<div className="w-16 p-4">
					<Story />
				</div>
			</SidebarProvider>
		),
	],
	args: {
		organizations: mockOrganizations,
		activeOrganization: mockOrganizations[0],
		onOrganizationChange: () => {},
		onCreateOrganization: () => {},
		isLoading: false,
	},
};

export const Empty: Story = {
	args: {
		organizations: [],
		activeOrganization: null,
		onOrganizationChange: () => {},
		onCreateOrganization: () => {},
		isLoading: false,
	},
};

export const Populated: Story = {
	args: {
		organizations: mockOrganizations,
		activeOrganization: mockOrganizations[0],
		onOrganizationChange: () => {},
		onCreateOrganization: () => {},
		isLoading: false,
	},
};

export const PopulatedWithLogos: Story = {
	args: {
		organizations: mockOrganizationsWithLogos,
		activeOrganization: mockOrganizationsWithLogos[0],
		onOrganizationChange: () => {},
		onCreateOrganization: () => {},
		isLoading: false,
	},
};

export const WithCreateCallback: Story = {
	args: {
		organizations: mockOrganizations,
		activeOrganization: mockOrganizations[0],
		onOrganizationChange: () => {},
		onCreateOrganization: () => {
			console.log("Create organization clicked");
		},
		isLoading: false,
	},
};

import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "../../components/data-table/data-table";
import type {
	ColumnDef,
	FilterDef,
	DataTableProps,
} from "../../components/data-table/types";
import { Filter, Trash2, Edit, MoreHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface SampleData {
	id: string;
	name: string;
	email: string;
	status: "active" | "inactive" | "pending";
	role: "admin" | "user" | "guest";
	createdAt: string;
}

const sampleData: SampleData[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john@example.com",
		status: "active",
		role: "admin",
		createdAt: "2024-01-15T10:00:00Z",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane@example.com",
		status: "pending",
		role: "user",
		createdAt: "2024-01-16T11:00:00Z",
	},
	{
		id: "3",
		name: "Bob Johnson",
		email: "bob@example.com",
		status: "inactive",
		role: "guest",
		createdAt: "2024-01-17T12:00:00Z",
	},
	{
		id: "4",
		name: "Alice Williams",
		email: "alice@example.com",
		status: "active",
		role: "user",
		createdAt: "2024-01-18T13:00:00Z",
	},
	{
		id: "5",
		name: "Charlie Brown",
		email: "charlie@example.com",
		status: "active",
		role: "admin",
		createdAt: "2024-01-19T14:00:00Z",
	},
];

const columns: ColumnDef<SampleData>[] = [
	{
		id: "name",
		header: "Name",
		accessorKey: "name",
		sortable: true,
	},
	{
		id: "email",
		header: "Email",
		accessorKey: "email",
		sortable: true,
		hideOnMobile: true,
	},
	{
		id: "status",
		header: "Status",
		accessorKey: "status",
		sortable: true,
		cell: (item) => {
			const colors = {
				active: "bg-emerald-500/20 text-emerald-400",
				inactive: "bg-zinc-500/20 text-zinc-400",
				pending: "bg-amber-500/20 text-amber-400",
			};
			return (
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${colors[item.status]}`}
				>
					{item.status}
				</span>
			);
		},
	},
	{
		id: "role",
		header: "Role",
		accessorKey: "role",
		sortable: true,
		hideOnMobile: true,
	},
	{
		id: "createdAt",
		header: "Created",
		accessorKey: "createdAt",
		sortable: true,
		hideOnMobile: true,
		cell: (item) => {
			const date = new Date(item.createdAt);
			return (
				<span className="text-sm text-muted-foreground">
					{date.toLocaleDateString()}
				</span>
			);
		},
	},
];

const filters: FilterDef[] = [
	{
		id: "status",
		label: "Status",
		icon: Filter,
		options: [
			{ value: "active", label: "Active" },
			{ value: "inactive", label: "Inactive" },
			{ value: "pending", label: "Pending" },
		],
	},
	{
		id: "role",
		label: "Role",
		icon: Filter,
		options: [
			{ value: "admin", label: "Admin" },
			{ value: "user", label: "User" },
			{ value: "guest", label: "Guest" },
		],
	},
];

// Create a typed wrapper component for Storybook
const TypedDataTable = (props: DataTableProps<SampleData>) => {
	return <DataTable<SampleData> {...props} />;
};

const meta = {
	title: "Components/DataTable",
	component: TypedDataTable,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof TypedDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		data: sampleData,
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		getId: (item) => item.id,
	},
};

export const WithActions: Story = {
	args: {
		data: sampleData,
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		getId: (item) => item.id,
		actions: (item) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem>
						<Edit className="mr-2 h-4 w-4" />
						Edit
					</DropdownMenuItem>
					<DropdownMenuItem className="text-destructive">
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
};

export const Selectable: Story = {
	args: {
		data: sampleData,
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		selectable: true,
		getId: (item) => item.id,
	},
};

export const Loading: Story = {
	args: {
		data: [],
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		isLoading: true,
		loadingMessage: "Loading users...",
		getId: (item) => item.id,
	},
};

export const Empty: Story = {
	args: {
		data: [],
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		getId: (item) => item.id,
	},
};

export const Mobile: Story = {
	args: {
		data: sampleData,
		columns,
		filters,
		searchKeys: ["name", "email"],
		searchPlaceholder: "Search users...",
		emptyMessage: "No users found",
		getId: (item) => item.id,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

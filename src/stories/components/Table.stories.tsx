import type { Meta, StoryObj } from "@storybook/react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const meta: Meta<typeof Table> = {
	title: "UI/Table",
	component: Table,
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
	render: () => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Email</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">John Doe</TableCell>
					<TableCell>Active</TableCell>
					<TableCell>john@example.com</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Jane Smith</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell>jane@example.com</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Bob Johnson</TableCell>
					<TableCell>Active</TableCell>
					<TableCell>bob@example.com</TableCell>
					<TableCell className="text-right">$350.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

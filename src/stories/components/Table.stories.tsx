import type { Meta, StoryObj } from "@storybook/react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	TableFooter,
	TableCaption,
} from "@/components/ui/table";

const meta: Meta<typeof Table> = {
	title: "UI/Table",
	component: Table,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
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

export const WithFooter: Story = {
	render: () => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Product</TableHead>
					<TableHead>Quantity</TableHead>
					<TableHead className="text-right">Price</TableHead>
					<TableHead className="text-right">Total</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">Widget A</TableCell>
					<TableCell>2</TableCell>
					<TableCell className="text-right">$10.00</TableCell>
					<TableCell className="text-right">$20.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">Widget B</TableCell>
					<TableCell>3</TableCell>
					<TableCell className="text-right">$15.00</TableCell>
					<TableCell className="text-right">$45.00</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3} className="text-right font-medium">
						Total
					</TableCell>
					<TableCell className="text-right font-medium">$65.00</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	),
};

export const WithCaption: Story = {
	render: () => (
		<Table>
			<TableCaption>A list of recent invoices.</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead>Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">INV001</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell>Credit Card</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV002</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell>PayPal</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};

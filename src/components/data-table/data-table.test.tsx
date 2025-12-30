import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./data-table";
import type { ColumnDef, FilterDef } from "./types";
import { Filter } from "lucide-react";

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: () => false,
}));

interface TestItem {
	id: string;
	name: string;
	status: string;
	category: string;
	value: number;
}

const mockData: TestItem[] = [
	{ id: "1", name: "Item One", status: "active", category: "A", value: 100 },
	{ id: "2", name: "Item Two", status: "inactive", category: "B", value: 200 },
	{ id: "3", name: "Item Three", status: "active", category: "A", value: 300 },
	{ id: "4", name: "Item Four", status: "pending", category: "C", value: 400 },
	{ id: "5", name: "Item Five", status: "active", category: "B", value: 500 },
];

const columns: ColumnDef<TestItem>[] = [
	{
		id: "name",
		header: "Name",
		accessorKey: "name",
		sortable: true,
	},
	{
		id: "status",
		header: "Status",
		accessorKey: "status",
	},
	{
		id: "value",
		header: "Value",
		accessorKey: "value",
		sortable: true,
		cell: (item) => `$${item.value}`,
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
		id: "category",
		label: "Category",
		icon: Filter,
		options: [
			{ value: "A", label: "Category A" },
			{ value: "B", label: "Category B" },
			{ value: "C", label: "Category C" },
		],
	},
];

describe("DataTable", () => {
	it("renders table with data", () => {
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		expect(screen.getByText("Item One")).toBeInTheDocument();
		expect(screen.getByText("Item Two")).toBeInTheDocument();
		// Result count is displayed in the footer
		expect(screen.getByText(String(mockData.length))).toBeInTheDocument();
	});

	it("shows loading state", () => {
		render(
			<DataTable
				data={[]}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				isLoading
				loadingMessage="Loading items..."
			/>,
		);

		expect(screen.getByText("Loading items...")).toBeInTheDocument();
	});

	it("shows empty state", () => {
		render(
			<DataTable
				data={[]}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				emptyMessage="No items found"
			/>,
		);

		expect(screen.getByText("No items found")).toBeInTheDocument();
	});

	it("filters data by search query", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				searchPlaceholder="Search items..."
				getId={(item) => item.id}
			/>,
		);

		const searchInput = screen.getByPlaceholderText("Search items...");
		await user.type(searchInput, "One");

		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
			expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
		});
	});

	it("clears search query", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				searchPlaceholder="Search items..."
				getId={(item) => item.id}
			/>,
		);

		const searchInput = screen.getByPlaceholderText("Search items...");
		await user.type(searchInput, "One");

		await waitFor(() => {
			expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
		});

		// Find and click the clear button (X icon)
		const clearButton = searchInput.parentElement?.querySelector("button");
		if (clearButton) {
			await user.click(clearButton);
		}

		await waitFor(() => {
			expect(screen.getByText("Item Two")).toBeInTheDocument();
		});
	});

	it("allows selecting rows", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				selectable
			/>,
		);

		const checkboxes = screen.getAllByRole("checkbox");
		await user.click(checkboxes[1]); // First item checkbox

		await waitFor(() => {
			expect(checkboxes[1]).toBeChecked();
			expect(screen.getByText(/1 seleccionado/)).toBeInTheDocument();
		});
	});

	it("allows selecting all rows", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				selectable
			/>,
		);

		const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
		await user.click(selectAllCheckbox);

		await waitFor(() => {
			expect(selectAllCheckbox).toBeChecked();
			expect(screen.getByText(/5 seleccionados/)).toBeInTheDocument();
		});
	});

	it("renders custom cell content", () => {
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// The value column should be formatted with $
		expect(screen.getByText("$100")).toBeInTheDocument();
		expect(screen.getByText("$200")).toBeInTheDocument();
	});

	it("renders sortable column headers", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Find the sortable column header button
		const sortableHeaders = screen
			.getAllByRole("button")
			.filter(
				(btn) =>
					btn.textContent?.includes("Name") ||
					btn.textContent?.includes("Value"),
			);

		expect(sortableHeaders.length).toBeGreaterThan(0);

		// Click to sort
		await user.click(sortableHeaders[0]);
	});

	it("renders filter buttons", () => {
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Use getAllByText since filter can appear in multiple places
		const statusFilters = screen.getAllByText("Status");
		const categoryFilters = screen.getAllByText("Category");
		expect(statusFilters.length).toBeGreaterThan(0);
		expect(categoryFilters.length).toBeGreaterThan(0);
	});

	it("opens filter popover on click", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		const statusFilterButtons = screen.getAllByText("Status");
		await user.click(statusFilterButtons[0]);

		// Wait for popover to open and find the filter options
		await waitFor(() => {
			// Find the popover content by role
			const popoverContent = document.querySelector(
				"[data-radix-popper-content-wrapper]",
			);
			expect(popoverContent).toBeInTheDocument();
			if (popoverContent) {
				const popover = within(popoverContent as HTMLElement);
				expect(popover.getByText("Active")).toBeInTheDocument();
				expect(popover.getByText("Inactive")).toBeInTheDocument();
				expect(popover.getByText("Pending")).toBeInTheDocument();
			}
		});
	});

	it("filters data when filter is selected", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Open status filter
		const statusFilterButtons = screen.getAllByText("Status");
		await user.click(statusFilterButtons[0]);

		// Wait for popover and click "Active" filter option
		await waitFor(() => {
			const popoverContent = document.querySelector(
				"[data-radix-popper-content-wrapper]",
			);
			expect(popoverContent).toBeInTheDocument();
		});

		const popoverContent = document.querySelector(
			"[data-radix-popper-content-wrapper]",
		);
		const popover = within(popoverContent as HTMLElement);
		await user.click(popover.getByText("Active"));

		// Check filtered results
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
			expect(screen.getByText("Item Three")).toBeInTheDocument();
			expect(screen.getByText("Item Five")).toBeInTheDocument();
			expect(screen.queryByText("Item Two")).not.toBeInTheDocument();
		});
	});

	it("shows active filter count on filter button", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Open status filter
		const statusFilterButtons = screen.getAllByText("Status");
		await user.click(statusFilterButtons[0]);

		// Wait for popover and click "Active" filter option
		await waitFor(() => {
			const popoverContent = document.querySelector(
				"[data-radix-popper-content-wrapper]",
			);
			expect(popoverContent).toBeInTheDocument();
		});

		const popoverContent = document.querySelector(
			"[data-radix-popper-content-wrapper]",
		);
		const popover = within(popoverContent as HTMLElement);
		await user.click(popover.getByText("Active"));

		// Check for count badge - need to wait for the badge to appear
		await waitFor(() => {
			// The count badge shows the number of active filters
			const badges = screen.getAllByText("1");
			expect(badges.length).toBeGreaterThan(0);
		});
	});

	it("calls onRowClick when row is clicked", async () => {
		const user = userEvent.setup();
		const onRowClick = vi.fn();

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				onRowClick={onRowClick}
			/>,
		);

		const row = screen.getByText("Item One").closest("tr");
		if (row) {
			await user.click(row);
		}

		expect(onRowClick).toHaveBeenCalledWith(mockData[0]);
	});

	it("renders row actions", async () => {
		const user = userEvent.setup();
		const actions = vi.fn().mockReturnValue(<button>Action</button>);

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				actions={actions}
			/>,
		);

		const actionButtons = screen.getAllByText("Action");
		expect(actionButtons.length).toBe(mockData.length);
	});

	it("shows pagination when there are many items", async () => {
		// Create more than 10 items to trigger pagination
		const manyItems: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
			id: String(i + 1),
			name: `Item ${i + 1}`,
			status: "active",
			category: "A",
			value: (i + 1) * 100,
		}));

		render(
			<DataTable
				data={manyItems}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Should show pagination controls
		await waitFor(() => {
			expect(screen.getByText("1 / 2")).toBeInTheDocument();
		});
	});

	it("paginates correctly", async () => {
		const user = userEvent.setup();
		const manyItems: TestItem[] = Array.from({ length: 15 }, (_, i) => ({
			id: String(i + 1),
			name: `Item ${i + 1}`,
			status: "active",
			category: "A",
			value: (i + 1) * 100,
		}));

		render(
			<DataTable
				data={manyItems}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// First page should show first 10 items
		expect(screen.getByText("Item 1")).toBeInTheDocument();
		expect(screen.queryByText("Item 11")).not.toBeInTheDocument();

		// Click next page
		const nextButtons = screen
			.getAllByRole("button")
			.filter((btn) => btn.querySelector('svg[class*="chevron-right"]'));

		if (nextButtons.length > 0) {
			await user.click(nextButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("Item 11")).toBeInTheDocument();
				expect(screen.queryByText("Item 1")).not.toBeInTheDocument();
			});
		}
	});
});

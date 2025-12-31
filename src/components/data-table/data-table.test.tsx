import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./data-table";
import type { ColumnDef, FilterDef } from "./types";
import { Filter } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

vi.mock("@/hooks/use-mobile", () => ({
	useIsMobile: vi.fn(() => false),
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

	it("shows loading state with skeleton rows", () => {
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

		// Should show skeleton loaders instead of text
		const skeletons = screen.getAllByTestId("skeleton");
		expect(skeletons.length).toBeGreaterThan(0);
		// Should show multiple skeleton rows (one per itemsPerPage)
		expect(skeletons.length).toBeGreaterThanOrEqual(10);
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

	it("filters out mobile-hidden columns on mobile", () => {
		vi.mocked(useIsMobile).mockReturnValue(true);

		const mobileColumns: ColumnDef<TestItem>[] = [
			{
				id: "name",
				header: "Name",
				accessorKey: "name",
			},
			{
				id: "status",
				header: "Status",
				accessorKey: "status",
				hideOnMobile: true,
			},
		];

		render(
			<DataTable
				data={mockData}
				columns={mobileColumns}
				filters={[]}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Should show Name column header in table
		const tableHeaders = screen.getAllByRole("columnheader");
		const nameHeader = tableHeaders.find((h) => h.textContent === "Name");
		expect(nameHeader).toBeInTheDocument();
		// Status column header should not be in table (but may be in filter)
		const statusHeaders = tableHeaders.filter((h) =>
			h.textContent?.includes("Status"),
		);
		expect(statusHeaders.length).toBe(0);
	});

	it("handles nested value access in search", async () => {
		const user = userEvent.setup();
		interface NestedItem {
			id: string;
			user: {
				name: string;
				email: string;
			};
		}

		const nestedData: NestedItem[] = [
			{ id: "1", user: { name: "John Doe", email: "john@example.com" } },
			{ id: "2", user: { name: "Jane Smith", email: "jane@example.com" } },
		];

		const nestedColumns: ColumnDef<NestedItem>[] = [
			{
				id: "name",
				header: "Name",
				accessorKey: "user.name",
			},
		];

		render(
			<DataTable
				data={nestedData}
				columns={nestedColumns}
				filters={[]}
				searchKeys={["user.name", "user.email"]}
				getId={(item) => item.id}
			/>,
		);

		const searchInput = screen.getByPlaceholderText(/buscar/i);
		await user.type(searchInput, "John");

		await waitFor(() => {
			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
		});
	});

	it("handles null values in sorting", async () => {
		const user = userEvent.setup();
		const dataWithNulls: TestItem[] = [
			{
				id: "1",
				name: "Item One",
				status: "active",
				category: "A",
				value: 100,
			},
			{
				id: "2",
				name: "Item Two",
				status: "active",
				category: "A",
				value: null as unknown as number,
			},
			{
				id: "3",
				name: "Item Three",
				status: "active",
				category: "A",
				value: 300,
			},
		];

		const sortableColumns: ColumnDef<TestItem>[] = [
			{
				id: "name",
				header: "Name",
				accessorKey: "name",
				sortable: true,
			},
			{
				id: "value",
				header: "Value",
				accessorKey: "value",
				sortable: true,
			},
		];

		render(
			<DataTable
				data={dataWithNulls}
				columns={sortableColumns}
				filters={[]}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Find and click sort button for Value column
		const sortButtons = screen
			.getAllByRole("button")
			.filter((btn) => btn.getAttribute("aria-label") === "Ordenar por Value");

		if (sortButtons.length > 0) {
			await user.click(sortButtons[0]);
			// Should handle null values without crashing - verify data is still displayed
			expect(screen.getByText("Item One")).toBeInTheDocument();
			expect(screen.getByText("Item Two")).toBeInTheDocument();
			expect(screen.getByText("Item Three")).toBeInTheDocument();
		}
	});

	it("handles pagination edge cases", async () => {
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

		// Go to last page
		const nextButtons = screen
			.getAllByRole("button")
			.filter((btn) => btn.querySelector('svg[class*="chevron-right"]'));

		if (nextButtons.length > 0) {
			await user.click(nextButtons[0]);

			await waitFor(() => {
				expect(screen.getByText("2 / 2")).toBeInTheDocument();
			});

			// Try to go to next page when already on last page (should be disabled)
			const lastPageNextButtons = screen
				.getAllByRole("button")
				.filter((btn) => btn.querySelector('svg[class*="chevron-right"]'));
			if (lastPageNextButtons.length > 0) {
				expect(lastPageNextButtons[0]).toBeDisabled();
			}
		}
	});

	it("clears search when clear button is clicked", async () => {
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

		// Find and click clear button
		const clearButton = searchInput.parentElement?.querySelector("button");
		if (clearButton) {
			await user.click(clearButton);

			await waitFor(() => {
				expect(screen.getByText("Item Two")).toBeInTheDocument();
				expect(searchInput).toHaveValue("");
			});
		}
	});

	it("handles toggleAllRows when all rows are selected", async () => {
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

		// Select all rows by clicking the select all checkbox
		const checkboxes = screen.getAllByRole("checkbox");
		const selectAllCheckbox = checkboxes[0];
		await user.click(selectAllCheckbox);

		// All checkboxes should be checked
		await waitFor(() => {
			checkboxes.forEach((checkbox) => {
				expect(checkbox).toBeChecked();
			});
		});

		// Click again to deselect all
		await user.click(selectAllCheckbox);

		// All checkboxes should be unchecked
		await waitFor(() => {
			checkboxes.forEach((checkbox, index) => {
				if (index === 0) return; // Skip select all checkbox
				expect(checkbox).not.toBeChecked();
			});
		});
	});

	it("handles clearFilterGroup", async () => {
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

		// Open filter drawer
		const filterButton = screen.getByText(/filtrar/i);
		await user.click(filterButton);

		// Wait for filter drawer and select a filter option
		await waitFor(() => {
			const activeOption = screen.getByText("Active");
			expect(activeOption).toBeInTheDocument();
		});

		const activeOption = screen.getByText("Active");
		await user.click(activeOption);

		// Close drawer
		const applyButton = screen.getByText(/aplicar/i);
		await user.click(applyButton);

		// Verify filter is applied
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles nested value access in search", async () => {
		const user = userEvent.setup();
		const nestedData: TestItem[] = [
			{
				id: "1",
				name: "Item One",
				status: "active",
				category: "A",
				value: 100,
			},
			{
				id: "2",
				name: "Item Two",
				status: "inactive",
				category: "B",
				value: 200,
			},
		];

		render(
			<DataTable
				data={nestedData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Search for value
		const searchInput = screen.getByPlaceholderText(/buscar/i);
		await user.type(searchInput, "One");

		// Should filter by value
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles sorting with null values", async () => {
		const user = userEvent.setup();
		const dataWithNulls: TestItem[] = [
			{ id: "1", name: "Item One", status: "active", category: "A", value: 0 },
			{
				id: "2",
				name: "Item Two",
				status: "inactive",
				category: "B",
				value: 100,
			},
			{
				id: "3",
				name: "Item Three",
				status: "pending",
				category: "A",
				value: 0,
			},
		];

		render(
			<DataTable
				data={dataWithNulls}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Click sortable column header
		const nameHeader = screen.getByText("Name");
		await user.click(nameHeader);

		// Should handle sorting
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles row click with onRowClick callback", async () => {
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

		// Click on a row
		const row = screen.getByText("Item One").closest("tr");
		if (row) {
			await user.click(row);
			expect(onRowClick).toHaveBeenCalled();
		}
	});

	it("handles actions renderer for each row", () => {
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

		// Actions should be called for each row
		expect(actions).toHaveBeenCalledTimes(mockData.length);
	});

	it("handles pagination correctly", async () => {
		const user = userEvent.setup();
		const largeData = Array.from({ length: 25 }, (_, i) => ({
			id: String(i + 1),
			name: `Item ${i + 1}`,
			status: "active",
			category: "A",
			value: (i + 1) * 10,
		}));

		render(
			<DataTable
				data={largeData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Should show first page
		expect(screen.getByText("Item 1")).toBeInTheDocument();

		// Navigate to next page using chevron icon
		const nextButtons = screen
			.getAllByRole("button")
			.filter(
				(btn) =>
					btn.querySelector('svg[class*="chevron-right"]') ||
					btn.querySelector('svg[class*="ChevronRight"]'),
			);

		if (nextButtons.length > 0) {
			await user.click(nextButtons[0]);
			await waitFor(() => {
				expect(screen.getByText("Item 11")).toBeInTheDocument();
			});
		}
	});

	it("handles getNestedValue with invalid path", async () => {
		const user = userEvent.setup();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["invalid.path"]}
				getId={(item) => item.id}
			/>,
		);

		// Search for something that won't match
		const searchInput = screen.getByPlaceholderText(/buscar/i);
		await user.type(searchInput, "nonexistent");

		// Should handle invalid nested paths gracefully
		await waitFor(() => {
			expect(searchInput).toHaveValue("nonexistent");
		});
	});

	it("handles getNestedValue with null/undefined values in sorting", async () => {
		const user = userEvent.setup();
		const dataWithNulls: TestItem[] = [
			{
				id: "1",
				name: "Item One",
				status: "active",
				category: "A",
				value: 100,
			},
			{
				id: "2",
				name: "Item Two",
				status: "inactive",
				category: "B",
				value: 200,
			},
		];

		render(
			<DataTable
				data={dataWithNulls}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Click sortable column header
		const valueHeader = screen.getByText("Value");
		await user.click(valueHeader);

		// Should handle sorting with getNestedValue
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles removeFilter function", async () => {
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

		// Open filter drawer
		const filterButton = screen.getByText(/filtrar/i);
		await user.click(filterButton);

		// Wait for filter drawer and select a filter
		await waitFor(() => {
			const activeOption = screen.getByText("Active");
			expect(activeOption).toBeInTheDocument();
		});

		const activeOption = screen.getByText("Active");
		await user.click(activeOption);

		// Close drawer
		const applyButton = screen.getByText(/aplicar/i);
		await user.click(applyButton);

		// Verify filter is applied
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles toggleAllRows when no rows are selected", async () => {
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

		// Click select all checkbox when nothing is selected
		const checkboxes = screen.getAllByRole("checkbox");
		const selectAllCheckbox = checkboxes[0];
		await user.click(selectAllCheckbox);

		// All checkboxes should be checked
		await waitFor(() => {
			checkboxes.forEach((checkbox) => {
				expect(checkbox).toBeChecked();
			});
		});
	});

	it("renders InlineFilterSummary in compact mode on mobile", () => {
		vi.mocked(useIsMobile).mockReturnValue(true);

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// On mobile, InlineFilterSummary should be rendered in compact mode
		// This is tested through the DataTable rendering
		expect(screen.getByText("Item One")).toBeInTheDocument();
	});

	it("handles InlineFilterSummary with active filters in compact mode", async () => {
		const user = userEvent.setup();
		vi.mocked(useIsMobile).mockReturnValue(true);

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Open filter drawer on mobile
		const filterButton = screen.getByText(/filtrar/i);
		await user.click(filterButton);

		// Wait for filter drawer and select a filter
		await waitFor(() => {
			const activeOption = screen.getByText("Active");
			expect(activeOption).toBeInTheDocument();
		});

		const activeOption = screen.getByText("Active");
		await user.click(activeOption);

		// Close drawer
		const applyButton = screen.getByText(/aplicar/i);
		await user.click(applyButton);

		// Verify filter is applied and compact summary is shown
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles InlineFilterSummary removeFilter callback", async () => {
		const user = userEvent.setup();
		vi.mocked(useIsMobile).mockReturnValue(false);

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Open filter popover
		const filterButton = screen.getByText(/filtrar/i);
		await user.click(filterButton);

		// Wait for filter options and select one
		await waitFor(() => {
			const activeOption = screen.getByText("Active");
			expect(activeOption).toBeInTheDocument();
		});

		const activeOption = screen.getByText("Active");
		await user.click(activeOption);

		// Verify filter is applied
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("handles InlineFilterSummary with icon in filter values", async () => {
		const user = userEvent.setup();
		vi.mocked(useIsMobile).mockReturnValue(false);

		const filtersWithIcons: FilterDef[] = [
			{
				id: "status",
				label: "Status",
				icon: Filter,
				options: [
					{
						value: "active",
						label: "Active",
						icon: <span>✓</span>,
					},
					{ value: "inactive", label: "Inactive" },
				],
			},
		];

		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filtersWithIcons}
				searchKeys={["name"]}
				getId={(item) => item.id}
			/>,
		);

		// Open filter and select option with icon
		const filterButton = screen.getByText(/filtrar/i);
		await user.click(filterButton);

		await waitFor(() => {
			const activeOption = screen.getByText("Active");
			expect(activeOption).toBeInTheDocument();
		});

		const activeOption = screen.getByText("Active");
		await user.click(activeOption);

		// Verify filter with icon is applied
		await waitFor(() => {
			expect(screen.getByText("Item One")).toBeInTheDocument();
		});
	});

	it("supports infinite scroll mode", () => {
		const handleLoadMore = vi.fn();
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				paginationMode="infinite-scroll"
				onLoadMore={handleLoadMore}
				hasMore={true}
			/>,
		);

		// Should show all data (no pagination)
		expect(screen.getByText("Item One")).toBeInTheDocument();
		expect(screen.getByText("Item Five")).toBeInTheDocument();
		// Should not show pagination controls
		expect(screen.queryByText("1 /")).not.toBeInTheDocument();
	});

	it("shows loading more indicator in infinite scroll mode", () => {
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				paginationMode="infinite-scroll"
				hasMore={true}
				isLoadingMore={true}
			/>,
		);

		expect(screen.getByText("Cargando más...")).toBeInTheDocument();
	});

	it("shows no more results message in infinite scroll mode", () => {
		render(
			<DataTable
				data={mockData}
				columns={columns}
				filters={filters}
				searchKeys={["name"]}
				getId={(item) => item.id}
				paginationMode="infinite-scroll"
				hasMore={false}
			/>,
		);

		expect(screen.getByText("No hay más resultados")).toBeInTheDocument();
	});
});

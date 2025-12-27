import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CatalogSelector } from "./CatalogSelector";
import type { CatalogItem } from "@/types/catalog";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";

vi.mock("@/hooks/useCatalogSearch");

const mockedUseCatalogSearch = vi.mocked(useCatalogSearch);
type CatalogSearchResult = ReturnType<typeof useCatalogSearch>;

const sampleItems: CatalogItem[] = [
	{
		id: "brand-1",
		catalogId: "vehicle-brands",
		name: "Toyota",
		normalizedName: "toyota",
		active: true,
		metadata: {
			originCountry: "JP",
		},
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

const createHookResult = (
	overrides: Partial<CatalogSearchResult> = {},
): CatalogSearchResult => ({
	items: sampleItems,
	pagination: {
		page: 1,
		pageSize: 25,
		total: sampleItems.length,
		totalPages: 1,
	},
	loading: false,
	loadingMore: false,
	error: null,
	searchTerm: "",
	setSearchTerm: vi.fn(),
	loadMore: vi.fn().mockResolvedValue(undefined),
	reload: vi.fn(),
	hasMore: false,
	...overrides,
});

beforeEach(() => {
	mockedUseCatalogSearch.mockReturnValue(createHookResult());
});

describe("CatalogSelector", () => {
	it("does not show raw ID in trigger while data is loading", () => {
		// Simulate initial loading state where pagination is null
		mockedUseCatalogSearch.mockReturnValue(
			createHookResult({
				items: [],
				pagination: null,
				loading: true,
			}),
		);

		render(
			<CatalogSelector
				catalogKey="countries"
				value="e4d46ea04f22ddfb2f82286f6ee226d3"
			/>,
		);

		const trigger = screen.getByRole("button");
		// Should show placeholder, not the raw ID
		expect(trigger).not.toHaveTextContent("e4d46ea04f22ddfb2f82286f6ee226d3");
	});

	it("shows item name after loading when value matches item ID", () => {
		const itemsWithId: CatalogItem[] = [
			{
				id: "country-mx-id",
				catalogId: "countries",
				name: "México",
				normalizedName: "mexico",
				active: true,
				metadata: {},
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
		];

		mockedUseCatalogSearch.mockReturnValue(
			createHookResult({
				items: itemsWithId,
				pagination: {
					page: 1,
					pageSize: 25,
					total: 1,
					totalPages: 1,
				},
				loading: false,
			}),
		);

		render(<CatalogSelector catalogKey="countries" value="country-mx-id" />);

		const trigger = screen.getByRole("button");
		// Should show the name, not the ID
		expect(trigger).toHaveTextContent("México");
		expect(trigger).not.toHaveTextContent("country-mx-id");
	});

	it("renders label and options", async () => {
		const user = userEvent.setup();
		render(
			<CatalogSelector catalogKey="vehicle-brands" label="Marca" value="" />,
		);

		expect(screen.getByText("Marca")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Marca" }));

		expect(await screen.findByText("Toyota")).toBeInTheDocument();
	});

	it("shows the selected value in the trigger", () => {
		render(<CatalogSelector catalogKey="vehicle-brands" value="Toyota" />);

		const trigger = screen.getByRole("button");
		expect(trigger).toHaveTextContent("Toyota");
	});

	it("clears the search field and hides results after selecting an option", async () => {
		const user = userEvent.setup();
		render(
			<CatalogSelector catalogKey="vehicle-brands" label="Marca" value="" />,
		);

		const trigger = screen.getByRole("button", { name: "Marca" });
		await user.click(trigger);

		const option = await screen.findByText("Toyota");
		await user.click(option);

		expect(screen.queryByText("Toyota")).not.toBeInTheDocument();

		await user.click(trigger);

		const searchInput = await screen.findByPlaceholderText(
			"Buscar en el catálogo...",
		);
		expect(searchInput).toHaveValue("");
	});

	it("calls onChange when an option is selected", async () => {
		const user = userEvent.setup();
		const handleChange = vi.fn();
		const handleValueChange = vi.fn();

		render(
			<CatalogSelector
				catalogKey="vehicle-brands"
				onChange={handleChange}
				onValueChange={handleValueChange}
				getOptionValue={(item) => item.name}
			/>,
		);

		const trigger = screen.getByRole("button", { name: /seleccionar opción/i });
		await user.click(trigger);
		const option = await screen.findByText("Toyota");

		await user.click(option);

		expect(handleChange).toHaveBeenCalledWith(sampleItems[0]);
		expect(handleValueChange).toHaveBeenCalledWith("Toyota");
		expect(screen.getByRole("button")).toHaveTextContent("Toyota");
	});

	it("shows the result summary only while searching", async () => {
		const user = userEvent.setup();
		mockedUseCatalogSearch.mockReturnValueOnce(
			createHookResult({
				searchTerm: "toy",
			}),
		);

		render(
			<CatalogSelector catalogKey="vehicle-brands" label="Marca" value="" />,
		);

		await user.click(screen.getByRole("button", { name: "Marca" }));
		const input = await screen.findByPlaceholderText(
			"Buscar en el catálogo...",
		);
		await user.type(input, "toy");

		expect(await screen.findByText(/Mostrando/)).toBeInTheDocument();
	});
});

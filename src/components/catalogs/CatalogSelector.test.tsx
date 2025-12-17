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
	error: null,
	searchTerm: "",
	setSearchTerm: vi.fn(),
	reload: vi.fn(),
	...overrides,
});

beforeEach(() => {
	mockedUseCatalogSearch.mockReturnValue(createHookResult());
});

describe("CatalogSelector", () => {
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

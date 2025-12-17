import type { Meta, StoryObj, Decorator } from "@storybook/react";
import { CatalogSelector } from "../../components/catalogs/CatalogSelector";
import type { CatalogResponse } from "../../types/catalog";

const mockCatalogResponse: CatalogResponse = {
	catalog: {
		id: "01JCXACB0001ABCDEFGHJ1",
		key: "vehicle-brands",
		name: "Vehicle Brands",
	},
	data: [
		{
			id: "01JCXAVB0001ABCDEFGHJ1",
			catalogId: "01JCXACB0001ABCDEFGHJ1",
			name: "Toyota",
			normalizedName: "toyota",
			active: true,
			metadata: { originCountry: "JP", foundedYear: 1937 },
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
		},
		{
			id: "01JCXAVB0002ABCDEFGHJ2",
			catalogId: "01JCXACB0001ABCDEFGHJ1",
			name: "Nissan",
			normalizedName: "nissan",
			active: true,
			metadata: { originCountry: "JP", foundedYear: 1933 },
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
		},
		{
			id: "01JCXAVB0003ABCDEFGHJ3",
			catalogId: "01JCXACB0001ABCDEFGHJ1",
			name: "Volkswagen",
			normalizedName: "volkswagen",
			active: true,
			metadata: { originCountry: "DE", foundedYear: 1937 },
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
		},
		{
			id: "01JCXAVB0004ABCDEFGHJ4",
			catalogId: "01JCXACB0001ABCDEFGHJ1",
			name: "Ford",
			normalizedName: "ford",
			active: true,
			metadata: { originCountry: "US", foundedYear: 1903 },
			createdAt: "2025-01-01T00:00:00.000Z",
			updatedAt: "2025-01-01T00:00:00.000Z",
		},
	],
	pagination: {
		page: 1,
		pageSize: 25,
		total: 4,
		totalPages: 1,
	},
};

const CatalogDecorator: Decorator = (Story) => {
	if (typeof window !== "undefined") {
		const originalFetch = window.fetch;
		window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof Request
						? input.url
						: "";

			if (url.includes("/api/v1/catalogs/vehicle-brands")) {
				return new Response(JSON.stringify(mockCatalogResponse), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			return originalFetch(input, init);
		};
	}

	return (
		<div className="max-w-md">
			<Story />
		</div>
	);
};

const meta = {
	title: "Catalogs/CatalogSelector",
	component: CatalogSelector,
	decorators: [CatalogDecorator],
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof CatalogSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		catalogKey: "vehicle-brands",
		label: "Marca",
		searchPlaceholder: "Buscar marca...",
	},
};

export const WithSelectedValue: Story = {
	args: {
		catalogKey: "vehicle-brands",
		label: "Marca",
		value: "Toyota",
		searchPlaceholder: "Buscar marca...",
	},
};

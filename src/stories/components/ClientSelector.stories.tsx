import type { Meta, StoryObj, Decorator } from "@storybook/react";
import { ClientSelector } from "../../components/clients/ClientSelector";
import { mockClients } from "../../data/mockClients";
import type { ClientsListResponse } from "../../types/client";

const ClientSelectorDecorator: Decorator = (Story) => {
	if (typeof window !== "undefined") {
		const originalFetch = window.fetch;
		window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof Request
						? input.url
						: "";

			// Mock listClients
			if (url.includes("/api/v1/clients")) {
				const urlObj = new URL(url);
				const search = urlObj.searchParams.get("search") || "";
				const page = parseInt(urlObj.searchParams.get("page") || "1");
				const limit = parseInt(urlObj.searchParams.get("limit") || "15");

				// Filter clients based on search term
				let filteredClients = mockClients;
				if (search) {
					const searchLower = search.toLowerCase();
					filteredClients = mockClients.filter(
						(client) =>
							client.rfc.toLowerCase().includes(searchLower) ||
							(client.businessName &&
								client.businessName.toLowerCase().includes(searchLower)) ||
							(client.firstName &&
								`${client.firstName} ${client.lastName} ${client.secondLastName || ""}`
									.toLowerCase()
									.includes(searchLower)),
					);
				}

				// Paginate
				const start = (page - 1) * limit;
				const end = start + limit;
				const paginatedClients = filteredClients.slice(start, end);

				return new Response(
					JSON.stringify({
						data: paginatedClients,
						pagination: {
							page,
							limit,
							total: filteredClients.length,
							totalPages: Math.ceil(filteredClients.length / limit),
						},
					} as ClientsListResponse),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			return originalFetch(input, init);
		};
	}

	return (
		<div className="max-w-md p-6">
			<Story />
		</div>
	);
};

const meta = {
	title: "Clients/ClientSelector",
	component: ClientSelector,
	decorators: [ClientSelectorDecorator],
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ClientSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: "Cliente",
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
	},
};

export const WithSelectedValue: Story = {
	args: {
		label: "Cliente",
		value: mockClients[0].id,
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
	},
};

export const WithHelperText: Story = {
	args: {
		label: "Cliente",
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
		helperText: "Selecciona el cliente para esta transacción",
	},
};

export const Required: Story = {
	args: {
		label: "Cliente",
		required: true,
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
	},
};

export const Disabled: Story = {
	args: {
		label: "Cliente",
		disabled: true,
		value: mockClients[0].id,
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
	},
};

export const WithCreateNew: Story = {
	args: {
		label: "Cliente",
		placeholder: "Seleccionar cliente",
		searchPlaceholder: "Buscar cliente por nombre o RFC...",
		onCreateNew: () => {
			console.log("Create new client clicked");
		},
	},
};

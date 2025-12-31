import type { Meta, StoryObj } from "@storybook/react";
import type React from "react";
import { AlertsTable } from "../../components/alerts/AlertsTable";
import { mockClients } from "../../data/mockClients";
import type { Alert, AlertsListResponse } from "../../lib/api/alerts";

const mockAlerts: Alert[] = [
	{
		id: "alert-1",
		alertRuleId: "rule-1",
		clientId: mockClients[0].rfc,
		status: "DETECTED",
		severity: "HIGH",
		idempotencyKey: "key-1",
		contextHash: "hash-1",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() + 86400000 * 7).toISOString(),
		isOverdue: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-1",
			name: "Operación inusual",
			description: "Detecta operaciones inusuales",
			active: true,
			severity: "HIGH",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-2",
		alertRuleId: "rule-2",
		clientId: mockClients[1].rfc,
		status: "SUBMITTED",
		severity: "MEDIUM",
		idempotencyKey: "key-2",
		contextHash: "hash-2",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() - 86400000).toISOString(),
		isOverdue: true,
		submittedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-2",
			name: "Transacción de alto monto",
			description: "Detecta transacciones de alto monto",
			active: true,
			severity: "MEDIUM",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-3",
		alertRuleId: "rule-3",
		clientId: mockClients[2].rfc,
		status: "FILE_GENERATED",
		severity: "CRITICAL",
		idempotencyKey: "key-3",
		contextHash: "hash-3",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() + 86400000 * 3).toISOString(),
		isOverdue: false,
		fileGeneratedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-3",
			name: "Estructuración",
			description: "Detecta estructuración",
			active: true,
			severity: "CRITICAL",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-4",
		alertRuleId: "rule-4",
		clientId: mockClients[3].rfc,
		status: "OVERDUE",
		severity: "HIGH",
		idempotencyKey: "key-4",
		contextHash: "hash-4",
		alertData: "{}",
		submissionDeadline: new Date(Date.now() - 86400000 * 5).toISOString(),
		isOverdue: true,
		notes: "Requiere atención urgente",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-4",
			name: "Operación sospechosa",
			description: "Detecta operaciones sospechosas",
			active: true,
			severity: "HIGH",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
	{
		id: "alert-5",
		alertRuleId: "rule-5",
		clientId: mockClients[4].rfc,
		status: "CANCELLED",
		severity: "LOW",
		idempotencyKey: "key-5",
		contextHash: "hash-5",
		alertData: "{}",
		isOverdue: false,
		cancellationReason: "Falso positivo",
		cancelledAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		alertRule: {
			id: "rule-5",
			name: "Patrón inusual",
			description: "Detecta patrones inusuales",
			active: true,
			severity: "LOW",
			ruleConfig: "{}",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	},
];

const AlertsTableDecorator = (Story: React.ComponentType) => {
	if (typeof window !== "undefined") {
		// Mock the API calls
		const originalFetch = window.fetch;
		window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			const url =
				typeof input === "string"
					? input
					: input instanceof Request
						? input.url
						: "";

			// Mock listAlerts
			if (url.includes("/api/v1/alerts")) {
				return new Response(
					JSON.stringify({
						data: mockAlerts,
						pagination: {
							page: 1,
							limit: 100,
							total: mockAlerts.length,
							totalPages: 1,
						},
					} as AlertsListResponse),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// Mock getClientByRfc
			if (url.includes("/api/v1/clients/")) {
				const rfc = url.split("/").pop();
				const client = mockClients.find((c) => c.rfc === rfc);
				if (client) {
					return new Response(JSON.stringify(client), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					});
				}
				return new Response(JSON.stringify({ error: "Not found" }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				});
			}

			return originalFetch(input, init);
		};
	}

	return (
		<div className="p-6">
			<Story />
		</div>
	);
};

const meta = {
	title: "Alerts/AlertsTable",
	component: AlertsTable,
	decorators: [AlertsTableDecorator],
	parameters: {
		layout: "padded",
		nextjs: {
			router: {
				pathname: "/alerts",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof AlertsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};

export const WithFilters: Story = {
	args: {
		filters: {
			status: "DETECTED",
			severity: "HIGH",
		},
	},
};

export const Mobile: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
	},
};

export const Tablet: Story = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "tablet",
		},
	},
};

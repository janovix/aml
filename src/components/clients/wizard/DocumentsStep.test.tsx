import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { renderWithProviders } from "@/lib/testHelpers";
import type { Client } from "@/types/client";

// Heavy children that hit APIs / catalogs / scanners. Replace them with
// thin stubs so the test focuses on the new Back button wiring.
vi.mock("./IDDocumentSelector", () => ({
	IDDocumentSelector: () => <div data-testid="mock-id-selector" />,
}));

vi.mock("./SimpleDocumentUploadCard", () => ({
	SimpleDocumentUploadCard: () => <div data-testid="mock-doc-upload" />,
}));

vi.mock("../ShareholderSection", () => ({
	ShareholderSection: () => <div data-testid="mock-shareholders" />,
}));

vi.mock("../BeneficialControllerSection", () => ({
	BeneficialControllerSection: () => <div data-testid="mock-bc" />,
}));

vi.mock("@/lib/api/shareholders", () => ({
	listClientShareholders: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api/beneficial-controllers", () => ({
	listClientBeneficialControllers: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api/client-documents", () => ({
	createClientDocument: vi.fn(),
}));

vi.mock("@/lib/api/file-upload", () => ({
	uploadDocumentForKYC: vi.fn(),
}));

import { DocumentsStep } from "./DocumentsStep";

const baseClient: Client = {
	id: "client-1",
	personType: "physical",
	rfc: "PECJ850615AAA",
	firstName: "JUAN",
	lastName: "PEREZ",
	email: "j@example.com",
	phone: "+5215555555555",
	stateCode: "CMX",
	city: "CDMX",
	municipality: "CUAUHTEMOC",
	neighborhood: "ROMA",
	street: "REFORMA",
	externalNumber: "1",
	postalCode: "06700",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
} as unknown as Client;

beforeEach(() => {
	sessionStorage.clear();
});

describe("DocumentsStep — Back button", () => {
	it("does not render the Back button when onBack is not provided", () => {
		renderWithProviders(
			<DocumentsStep
				clientId="client-1"
				client={baseClient}
				personType="physical"
				onComplete={vi.fn()}
				onSkip={vi.fn()}
			/>,
		);

		expect(
			screen.queryByRole("button", { name: /^volver$/i }),
		).not.toBeInTheDocument();
	});

	it("renders an outline Back button and invokes onBack exactly once", async () => {
		const onBack = vi.fn();
		renderWithProviders(
			<DocumentsStep
				clientId="client-1"
				client={baseClient}
				personType="physical"
				onComplete={vi.fn()}
				onSkip={vi.fn()}
				onBack={onBack}
			/>,
		);

		const back = screen.getByRole("button", { name: /^volver$/i });
		expect(back).toBeInTheDocument();

		await userEvent.click(back);
		expect(onBack).toHaveBeenCalledTimes(1);
	});
});

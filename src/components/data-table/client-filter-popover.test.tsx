"use client";

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientFilterPopover } from "./client-filter-popover";
import type { Client } from "@/types/client";

vi.mock("@/hooks/useJwt", () => ({
	useJwt: () => ({ jwt: "jwt-1" }),
}));

const mockSetClientSearchTerm = vi.fn();

vi.mock("@/hooks/useClientSearch", () => ({
	useClientSearch: () => ({
		items: [
			{
				id: "c1",
				rfc: "RFC1",
				personType: "physical",
				firstName: "Ana",
				lastName: "Lopez",
			} as Client,
		],
		loading: false,
		error: null,
		setSearchTerm: mockSetClientSearchTerm,
		pagination: { page: 1, totalPages: 1 },
	}),
}));

vi.mock("@/lib/api/clients", () => ({
	getClientById: vi.fn().mockResolvedValue({
		id: "sel",
		rfc: "SEL",
		personType: "physical",
		firstName: "Sel",
		lastName: "User",
	} as Client),
}));

describe("ClientFilterPopover", () => {
	beforeEach(() => {
		mockSetClientSearchTerm.mockClear();
	});

	it("invokes onToggleFilter when selecting a client", async () => {
		const user = userEvent.setup();
		const onToggleFilter = vi.fn();
		const onClear = vi.fn();

		render(
			<ClientFilterPopover
				activeValues={[]}
				onToggleFilter={onToggleFilter}
				onClear={onClear}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /cliente/i }));
		await user.click(await screen.findByText(/ana/i));
		expect(onToggleFilter).toHaveBeenCalledWith("c1");
	});

	it("calls onClear from header button when active", async () => {
		const user = userEvent.setup();
		const onClear = vi.fn();

		render(
			<ClientFilterPopover
				activeValues={["x"]}
				onToggleFilter={vi.fn()}
				onClear={onClear}
				clearText="Quitar"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /cliente/i }));
		await user.click(screen.getByRole("button", { name: /quitar/i }));
		expect(onClear).toHaveBeenCalled();
	});

	it("resets search term when popover closes", async () => {
		const user = userEvent.setup();

		render(
			<ClientFilterPopover
				activeValues={[]}
				onToggleFilter={vi.fn()}
				onClear={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: /cliente/i }));
		mockSetClientSearchTerm.mockClear();
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(mockSetClientSearchTerm).toHaveBeenCalledWith(""),
		);
	});
});

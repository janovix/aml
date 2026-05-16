import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./data-tools", () => ({
	createDataTools: vi.fn(() => ({ dataToolsMock: true })),
}));

vi.mock("./extended-tools", () => ({
	createExtendedJanbotTools: vi.fn(() => ({ extendedMock: true })),
}));

vi.mock("./auth-tools", () => ({
	createAuthJanbotTools: vi.fn(() => ({ authMock: true })),
}));

vi.mock("./import-tool", () => ({
	createImportTool: vi.fn(() => ({ importMock: true })),
}));

import { createDataTools } from "./data-tools";
import { createExtendedJanbotTools } from "./extended-tools";
import { createAuthJanbotTools } from "./auth-tools";
import { createImportTool } from "./import-tool";
import { buildJanbotTools } from "./registry";

describe("buildJanbotTools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("forwards dataEnvironment to AML tool factories (defaults to production)", () => {
		buildJanbotTools({ jwt: "jwt-1" });
		expect(createDataTools).toHaveBeenCalledWith("jwt-1", {
			dataEnvironment: "production",
		});
		expect(createExtendedJanbotTools).toHaveBeenCalledWith("jwt-1", {
			dataEnvironment: "production",
		});
	});

	it("forwards staging dataEnvironment and registers auth tools when cookieHeader is set", () => {
		buildJanbotTools({
			jwt: "jwt-2",
			dataEnvironment: "staging",
			cookieHeader: "session=abc",
		});
		expect(createDataTools).toHaveBeenCalledWith("jwt-2", {
			dataEnvironment: "staging",
		});
		expect(createAuthJanbotTools).toHaveBeenCalledWith({
			cookieHeader: "session=abc",
		});
	});

	it("omits auth tools when cookieHeader is missing", () => {
		buildJanbotTools({ jwt: "jwt-3", dataEnvironment: "development" });
		expect(createAuthJanbotTools).not.toHaveBeenCalled();
	});

	it("passes import opts when fileUpload is present", () => {
		const fileUpload = {
			fileName: "x.csv",
			entityType: "CLIENT" as const,
			fileContent: "",
		};
		buildJanbotTools({
			jwt: "jwt-4",
			dataEnvironment: "development",
			fileUpload,
		});
		expect(createImportTool).toHaveBeenCalledWith(
			"jwt-4",
			fileUpload,
			undefined,
			{ dataEnvironment: "development" },
		);
	});
});

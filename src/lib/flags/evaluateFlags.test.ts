import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { evaluateFlagsForSession } from "./evaluateFlags";
import { getJwt } from "@/lib/auth/getJwt";
import { getServerSession } from "@/lib/auth/getServerSession";

vi.mock("@/lib/auth/config", () => ({
	getFlagsServiceUrl: vi.fn(() => "https://flags.example"),
}));

vi.mock("@/lib/auth/getJwt", () => ({
	getJwt: vi.fn(),
}));

vi.mock("@/lib/auth/getServerSession", () => ({
	getServerSession: vi.fn(),
}));

describe("evaluateFlagsForSession", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	beforeEach(() => {
		vi.mocked(getJwt).mockReset();
		vi.mocked(getServerSession).mockReset();
	});

	it("returns empty flags when keys is empty", async () => {
		await expect(evaluateFlagsForSession([])).resolves.toEqual({
			flags: {},
			error: null,
		});
	});

	it("returns error when JWT missing", async () => {
		vi.mocked(getJwt).mockResolvedValue(null);
		await expect(evaluateFlagsForSession(["a"])).resolves.toEqual({
			flags: {},
			error: "Not authenticated",
		});
	});

	it("POSTs evaluate request and returns result flags", async () => {
		vi.mocked(getJwt).mockResolvedValue("jwt-abc");
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "user-1" },
			session: { activeOrganizationId: "org-9" },
		} as never);

		const fetchMock = vi.fn(async () => {
			return new Response(
				JSON.stringify({ success: true, result: { myFlag: true } }),
				{ status: 200, headers: { "content-type": "application/json" } },
			);
		});
		vi.stubGlobal("fetch", fetchMock);

		const r = await evaluateFlagsForSession(["myFlag"]);
		expect(r.error).toBeNull();
		expect(r.flags).toEqual({ myFlag: true });
		expect(fetchMock).toHaveBeenCalledWith(
			"https://flags.example/api/flags/evaluate",
			expect.objectContaining({ method: "POST" }),
		);
		const firstCall = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit | undefined,
		];
		const init = firstCall[1];
		expect(init?.body).toBeDefined();
		expect(JSON.parse(String(init?.body))).toMatchObject({
			keys: ["myFlag"],
			context: expect.objectContaining({
				organizationId: "org-9",
				userId: "user-1",
			}),
		});
	});

	it("returns error payload when response not ok", async () => {
		vi.mocked(getJwt).mockResolvedValue("jwt");
		vi.mocked(getServerSession).mockResolvedValue({
			user: { id: "u" },
			session: {},
		} as never);

		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response("", { status: 502 })),
		);

		const r = await evaluateFlagsForSession(["k"]);
		expect(r.flags).toEqual({});
		expect(r.error).toBe("Flags evaluate failed (502)");
	});
});

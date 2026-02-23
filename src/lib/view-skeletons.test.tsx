import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

// Unmock view-skeletons for this test file since we're testing the actual implementation
vi.unmock("@/lib/view-skeletons");

import { getViewSkeleton, VIEW_SKELETON_MAP } from "./view-skeletons";
import { REQUIRED_SKELETON_ROUTES } from "./constants/skeleton-patterns";

describe("view-skeletons", () => {
	describe("getViewSkeleton", () => {
		it("returns dashboard skeleton for root path", () => {
			const Skeleton = getViewSkeleton("/");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/"]);
		});

		it("returns dashboard skeleton for /dashboard", () => {
			const Skeleton = getViewSkeleton("/dashboard");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/dashboard"]);
		});

		it("returns clients list skeleton for /clients", () => {
			const Skeleton = getViewSkeleton("/clients");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients"]);
		});

		it("returns form skeleton for /clients/new", () => {
			const Skeleton = getViewSkeleton("/clients/new");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients/new"]);
		});

		it("returns client details skeleton for /clients/[id]", () => {
			const Skeleton = getViewSkeleton("/clients/123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients/[id]"]);
		});

		it("returns client edit skeleton for /clients/[id]/edit", () => {
			const Skeleton = getViewSkeleton("/clients/123/edit");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients/[id]/edit"]);
		});

		it("returns operations list skeleton for /operations", () => {
			const Skeleton = getViewSkeleton("/operations");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/operations"]);
		});

		it("returns operation details skeleton for /operations/[id]", () => {
			const Skeleton = getViewSkeleton("/operations/abc-123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/operations/[id]"]);
		});

		it("returns operation edit skeleton for /operations/[id]/edit", () => {
			const Skeleton = getViewSkeleton("/operations/abc-123/edit");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/operations/[id]/edit"]);
		});

		it("returns alerts list skeleton for /alerts", () => {
			const Skeleton = getViewSkeleton("/alerts");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/alerts"]);
		});

		it("returns alert details skeleton for /alerts/[id]", () => {
			const Skeleton = getViewSkeleton("/alerts/alert-123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/alerts/[id]"]);
		});

		it("returns reports list skeleton for /reports", () => {
			const Skeleton = getViewSkeleton("/reports");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/reports"]);
		});

		it("returns report details skeleton for /reports/[id]", () => {
			const Skeleton = getViewSkeleton("/reports/report-123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/reports/[id]"]);
		});

		it("returns notices list skeleton for /notices", () => {
			const Skeleton = getViewSkeleton("/notices");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/notices"]);
		});

		it("returns notice details skeleton for /notices/[id]", () => {
			const Skeleton = getViewSkeleton("/notices/notice-123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/notices/[id]"]);
		});

		it("returns invoices list skeleton for /invoices", () => {
			const Skeleton = getViewSkeleton("/invoices");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/invoices"]);
		});

		it("returns invoice details skeleton for /invoices/[id]", () => {
			const Skeleton = getViewSkeleton("/invoices/inv-456");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/invoices/[id]"]);
		});

		it("returns cfdi review skeleton for /invoices/[id]/create-operation", () => {
			const Skeleton = getViewSkeleton("/invoices/inv-456/create-operation");
			expect(Skeleton).toBe(
				VIEW_SKELETON_MAP["/invoices/[id]/create-operation"],
			);
		});

		it("returns import list skeleton for /import", () => {
			const Skeleton = getViewSkeleton("/import");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/import"]);
		});

		it("returns import detail skeleton for /import/[importId]", () => {
			const Skeleton = getViewSkeleton("/import/import-789");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/import/[importId]"]);
		});

		it("returns settings skeleton for /settings", () => {
			const Skeleton = getViewSkeleton("/settings");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/settings"]);
		});

		it("returns team skeleton for /team", () => {
			const Skeleton = getViewSkeleton("/team");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/team"]);
		});

		it("returns default skeleton for unknown paths", () => {
			const Skeleton = getViewSkeleton("/unknown/path");
			// Should render without error
			const { container } = render(<Skeleton />);
			expect(container.firstChild).not.toBeNull();
		});

		it("handles paths with trailing slashes", () => {
			const Skeleton = getViewSkeleton("/clients/");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients"]);
		});

		it("handles paths with multiple leading slashes", () => {
			const Skeleton = getViewSkeleton("///clients");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/clients"]);
		});

		it("renders ListViewSkeleton correctly", () => {
			const Skeleton = VIEW_SKELETON_MAP["/clients"];
			const { container } = render(<Skeleton />);
			expect(container.firstChild).not.toBeNull();
		});

		it("renders FormViewSkeleton correctly", () => {
			const Skeleton = VIEW_SKELETON_MAP["/clients/new"];
			const { container } = render(<Skeleton />);
			expect(container.firstChild).not.toBeNull();
		});
	});

	describe("skeleton coverage", () => {
		it("VIEW_SKELETON_MAP has entries for all required routes", () => {
			const missingRoutes = REQUIRED_SKELETON_ROUTES.filter(
				(route) => !(route in VIEW_SKELETON_MAP),
			);
			expect(missingRoutes).toEqual([]);
		});

		it("all skeleton entries are callable functions", () => {
			for (const [route, skeleton] of Object.entries(VIEW_SKELETON_MAP)) {
				expect(
					typeof skeleton,
					`Skeleton for ${route} must be a function`,
				).toBe("function");
			}
		});
	});
});

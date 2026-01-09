import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getViewSkeleton, VIEW_SKELETON_MAP } from "./view-skeletons";

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

		it("returns transactions list skeleton for /transactions", () => {
			const Skeleton = getViewSkeleton("/transactions");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/transactions"]);
		});

		it("returns transaction details skeleton for /transactions/[id]", () => {
			const Skeleton = getViewSkeleton("/transactions/abc-123");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/transactions/[id]"]);
		});

		it("returns transaction edit skeleton for /transactions/[id]/edit", () => {
			const Skeleton = getViewSkeleton("/transactions/abc-123/edit");
			expect(Skeleton).toBe(VIEW_SKELETON_MAP["/transactions/[id]/edit"]);
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
});

import { describe, it, expect } from "vitest";
import {
	getActivityVisual,
	getAllActivityVisuals,
	getEnabledActivityVisuals,
	getThresholdStatus,
	type ActivityVisual,
} from "./activity-registry";
import type { ActivityCode } from "@/types/operation";

const ALL_CODES: ActivityCode[] = [
	"JYS",
	"TSC",
	"TPP",
	"TDR",
	"CHV",
	"MPC",
	"INM",
	"DIN",
	"MJR",
	"OBA",
	"VEH",
	"BLI",
	"TCV",
	"SPR",
	"FEP",
	"FES",
	"DON",
	"ARI",
	"AVI",
];

describe("activity-registry", () => {
	describe("getActivityVisual", () => {
		it("returns a visual config for every activity code", () => {
			for (const code of ALL_CODES) {
				const visual = getActivityVisual(code);
				expect(visual).toBeDefined();
				expect(visual.code).toBe(code);
			}
		});

		it("returns icon, color, labels, and thresholds for VEH", () => {
			const visual = getActivityVisual("VEH");
			expect(visual.icon).toBeDefined();
			expect(visual.color).toBeDefined();
			expect(visual.label).toContain("vehículo");
			expect(visual.shortLabel).toBe("Vehículos");
			expect(visual.identificationThresholdUma).toBe(3210);
			expect(visual.noticeThresholdUma).toBe(6420);
		});

		it("returns ALWAYS thresholds for SPR", () => {
			const visual = getActivityVisual("SPR");
			expect(visual.identificationThresholdUma).toBe("ALWAYS");
			expect(visual.noticeThresholdUma).toBe("ALWAYS");
		});

		it("marks FES as disabled", () => {
			const visual = getActivityVisual("FES");
			expect(visual.disabled).toBe(true);
			expect(visual.disabledReason).toBeDefined();
		});

		it("all visuals have required color tokens", () => {
			for (const code of ALL_CODES) {
				const visual = getActivityVisual(code);
				expect(visual.color.badgeBg).toBeDefined();
				expect(visual.color.badgeText).toBeDefined();
				expect(visual.color.border).toBeDefined();
				expect(visual.color.icon).toBeDefined();
				expect(visual.color.ring).toBeDefined();
			}
		});
	});

	describe("getAllActivityVisuals", () => {
		it("returns all 19 activity visuals", () => {
			const all = getAllActivityVisuals();
			expect(all).toHaveLength(19);
		});

		it("returns array of ActivityVisual objects", () => {
			const all = getAllActivityVisuals();
			for (const visual of all) {
				expect(visual.code).toBeDefined();
				expect(visual.icon).toBeDefined();
				expect(visual.label).toBeDefined();
			}
		});
	});

	describe("getEnabledActivityVisuals", () => {
		it("excludes disabled activities (FES)", () => {
			const enabled = getEnabledActivityVisuals();
			expect(enabled).toHaveLength(18); // 19 total - 1 disabled
			expect(enabled.find((v) => v.code === "FES")).toBeUndefined();
		});

		it("includes all non-disabled activities", () => {
			const enabled = getEnabledActivityVisuals();
			const enabledCodes = enabled.map((v) => v.code);
			expect(enabledCodes).toContain("VEH");
			expect(enabledCodes).toContain("INM");
			expect(enabledCodes).toContain("AVI");
		});
	});

	describe("getThresholdStatus", () => {
		const UMA_VALUE = 113.14; // ~2025 UMA daily value

		it("correctly identifies exceeded identification threshold", () => {
			// VEH: 3210 UMA → 3210 * 113.14 = ~363,179
			const result = getThresholdStatus("VEH", 400_000, UMA_VALUE);
			expect(result.exceedsIdentification).toBe(true);
			expect(result.identificationMxn).toBeCloseTo(3210 * UMA_VALUE, 0);
		});

		it("correctly identifies not exceeded thresholds", () => {
			const result = getThresholdStatus("VEH", 1000, UMA_VALUE);
			expect(result.exceedsIdentification).toBe(false);
			expect(result.exceedsNotice).toBe(false);
		});

		it("returns null thresholds for ALWAYS activities", () => {
			const result = getThresholdStatus("SPR", 1000, UMA_VALUE);
			expect(result.identificationMxn).toBeNull();
			expect(result.noticeMxn).toBeNull();
			expect(result.exceedsIdentification).toBe(true); // ALWAYS exceeds
			expect(result.exceedsNotice).toBe(true); // ALWAYS exceeds
		});

		it("handles mixed ALWAYS and numeric thresholds", () => {
			// CHV: identification = ALWAYS, notice = 645 UMA
			const result = getThresholdStatus("CHV", 100_000, UMA_VALUE);
			expect(result.exceedsIdentification).toBe(true);
			expect(result.identificationMxn).toBeNull();
			expect(result.noticeMxn).toBeCloseTo(645 * UMA_VALUE, 0);
		});

		it("returns correct notice threshold exceeded", () => {
			// VEH: notice = 6420 UMA → 6420 * 113.14 = ~726,358
			const result = getThresholdStatus("VEH", 800_000, UMA_VALUE);
			expect(result.exceedsNotice).toBe(true);
		});

		it("returns correct notice threshold not exceeded", () => {
			const result = getThresholdStatus("VEH", 100_000, UMA_VALUE);
			expect(result.exceedsNotice).toBe(false);
		});
	});
});

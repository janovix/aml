/**
 * Standard skeleton pattern documentation for AML views.
 *
 * These constants describe the expected structure of each skeleton type and
 * serve as a reference for building new skeletons. They are also used in
 * tests to verify skeleton coverage is complete.
 *
 * See also: `src/lib/view-skeletons.tsx` for the route-to-skeleton map.
 * See also: `.cursor/rules/skeleton-loading.mdc` for implementation rules.
 */

/** All view types that have a skeleton pattern */
export const SKELETON_VIEW_TYPES = [
	"dashboard",
	"list",
	"form",
	"detail",
	"import-detail",
] as const;

export type SkeletonViewType = (typeof SKELETON_VIEW_TYPES)[number];

/**
 * Describes the structure expected of each skeleton type.
 * Used to guide consistent skeleton implementation.
 */
export const SKELETON_PATTERNS: Record<
	SkeletonViewType,
	{ description: string; heroVariant: string; bodyDescription: string }
> = {
	dashboard: {
		description: "Dashboard home with stats cards and content sections",
		heroVariant: "PageHeroSkeleton with showStats=true",
		bodyDescription: "Two-column grid of stat cards and content cards",
	},
	list: {
		description: "Table/list view with search, filters, and pagination",
		heroVariant: "PageHeroSkeleton with showStats=false, showActions=true",
		bodyDescription: "TableSkeleton with 10 rows and 5 columns",
	},
	form: {
		description: "Create or edit form with multiple sections",
		heroVariant: "PageHeroSkeleton with showStats=false, showBackButton=true",
		bodyDescription: "3 stacked card blocks (max-w-4xl)",
	},
	detail: {
		description: "Detail view with hero and multiple info cards",
		heroVariant: "PageHeroSkeleton with showStats=false, showBackButton=true",
		bodyDescription:
			"Grid of Card skeletons mirroring the real view's card layout",
	},
	"import-detail": {
		description: "Import progress view with progress card and row table",
		heroVariant: "None (import view has its own header-less layout)",
		bodyDescription: "Progress card skeleton + rows list skeleton",
	},
};

/**
 * Every route segment that must have an entry in VIEW_SKELETON_MAP.
 * Used in tests to ensure complete coverage.
 */
export const REQUIRED_SKELETON_ROUTES = [
	"/",
	"/dashboard",
	"/clients",
	"/clients/new",
	"/clients/[id]",
	"/clients/[id]/edit",
	"/operations",
	"/operations/new",
	"/operations/[id]",
	"/operations/[id]/edit",
	"/alerts",
	"/alerts/new",
	"/alerts/[id]",
	"/reports",
	"/reports/new",
	"/reports/[id]",
	"/notices",
	"/notices/new",
	"/notices/[id]",
	"/invoices",
	"/invoices/upload",
	"/invoices/[id]",
	"/invoices/[id]/create-operation",
	"/import",
	"/import/[importId]",
	"/settings",
	"/team",
] as const;

export type RequiredSkeletonRoute = (typeof REQUIRED_SKELETON_ROUTES)[number];

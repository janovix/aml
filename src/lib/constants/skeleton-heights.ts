/**
 * Standardized height constants for skeleton components
 * Used to prevent layout jumping during loading states
 */
export const SKELETON_HEIGHTS = {
	/** Height for PageHero with stats cards (~title + 3 stat cards) */
	PAGE_HERO_WITH_STATS: "min-h-[200px]",
	/** Height for PageHero without stats (title row only) */
	PAGE_HERO_NO_STATS: "min-h-[60px]",
	/** Minimum height for table skeleton (header + 10 rows) */
	TABLE_MIN: "min-h-[540px]",
	/** Height for a single table row */
	TABLE_ROW: "h-12",
	/** Number of default skeleton rows in table */
	TABLE_DEFAULT_ROWS: 10,
} as const;

export type SkeletonHeightKey = keyof typeof SKELETON_HEIGHTS;

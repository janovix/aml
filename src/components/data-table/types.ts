import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Column definition for the data table
 */
export interface ColumnDef<T> {
	/** Unique identifier for the column */
	id: string;
	/** Header text for the column */
	header: string;
	/** Key to access the value in the data object (supports nested paths with dot notation) */
	accessorKey: keyof T | string;
	/** Custom cell renderer */
	cell?: (item: T) => ReactNode;
	/** Whether the column is sortable */
	sortable?: boolean;
	/** Additional CSS classes for the column */
	className?: string;
	/** Hide this column on mobile devices */
	hideOnMobile?: boolean;
}

/**
 * Filter option type
 */
export interface FilterOption {
	/** Value to filter by */
	value: string;
	/** Display label for the option */
	label: string;
	/** Optional icon to display */
	icon?: ReactNode;
	/** Optional color class */
	color?: string;
}

/**
 * Filter definition for the data table
 */
export interface FilterDef {
	/** Unique identifier for the filter (should match the data property) */
	id: string;
	/** Display label for the filter */
	label: string;
	/** Icon to display in the filter button */
	icon: LucideIcon;
	/** Available filter options */
	options: FilterOption[];
	/** Whether multiple options can be selected (default: true) */
	multiSelect?: boolean;
}

/**
 * Active filter state
 */
export interface ActiveFilter {
	/** Filter ID */
	filterId: string;
	/** Filter label */
	filterLabel: string;
	/** Selected values with their labels and icons */
	values: { value: string; label: string; icon?: ReactNode }[];
}

/**
 * Data table component props
 */
export interface DataTableProps<T> {
	/** Data array to display */
	data: T[];
	/** Column definitions */
	columns: ColumnDef<T>[];
	/** Filter definitions */
	filters: FilterDef[];
	/** Keys to search in (supports nested paths) */
	searchKeys: (keyof T | string)[];
	/** Placeholder text for search input */
	searchPlaceholder?: string;
	/** Table title */
	title?: string;
	/** Table subtitle */
	subtitle?: string;
	/** Message to display when no results */
	emptyMessage?: string;
	/** Callback when a row is clicked */
	onRowClick?: (item: T) => void;
	/** Render function for row actions */
	actions?: (item: T) => ReactNode;
	/** Whether rows are selectable */
	selectable?: boolean;
	/** Function to get unique ID from item */
	getId: (item: T) => string;
	/** Whether data is loading */
	isLoading?: boolean;
	/** Loading message */
	loadingMessage?: string;
	/** Text for filter button */
	filterButtonText?: string;
	/** Text for clear all button */
	clearAllText?: string;
	/** Text for clear button */
	clearText?: string;
	/** Text for filters title */
	filtersTitleText?: string;
	/** Text for apply filters button */
	applyFiltersText?: string;
	/** Text for result (singular) */
	resultText?: string;
	/** Text for results (plural) */
	resultsText?: string;
	/** Text for selected (singular) */
	selectedText?: string;
	/** Text for selected (plural) */
	selectedPluralText?: string;
	/** Text for filter (singular) */
	filterText?: string;
	/** Text for filters (plural) */
	filtersText?: string;
	/** Text for active (singular) */
	activeText?: string;
	/** Text for active (plural) */
	activePluralText?: string;
	/** Aria label for clear search button */
	clearSearchAriaLabel?: string;
	/** Pagination mode: 'pagination' or 'infinite-scroll' (default: 'pagination') */
	paginationMode?: "pagination" | "infinite-scroll";
	/** Items per page for pagination mode (default: 10) */
	itemsPerPage?: number;
	/** Callback when more items should be loaded (for infinite scroll) */
	onLoadMore?: () => void;
	/** Whether more items are available to load (for infinite scroll) */
	hasMore?: boolean;
	/** Whether currently loading more items (for infinite scroll) */
	isLoadingMore?: boolean;
}

/**
 * Sort state
 */
export interface SortState {
	/** Field being sorted */
	field: string | null;
	/** Sort direction */
	direction: "asc" | "desc";
}

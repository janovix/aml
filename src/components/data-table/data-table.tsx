"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
	Search,
	X,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Loader2,
	SearchX,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { SKELETON_HEIGHTS } from "@/lib/constants/skeleton-heights";
import type { DataTableProps, SortState, ActiveFilter } from "./types";
import { FilterDrawer } from "./filter-drawer";
import { FilterPopover } from "./filter-popover";
import { InlineFilterSummary } from "./inline-filter-summary";

const ITEMS_PER_PAGE = 10;

export function DataTable<T extends object>({
	data,
	columns,
	filters,
	searchKeys,
	searchPlaceholder = "Buscar...",
	emptyMessage = "No se encontraron resultados",
	emptyIcon: EmptyIcon = SearchX,
	emptyActionLabel,
	emptyActionHref,
	onEmptyAction,
	onRowClick,
	actions,
	selectable = false,
	getId,
	isLoading = false,
	loadingMessage = "Cargando...",
	filterButtonText = "Filtrar",
	clearAllText = "Limpiar todo",
	clearText = "Limpiar",
	filtersTitleText = "Filtros",
	applyFiltersText = "Aplicar Filtros",
	resultText = "resultado",
	resultsText = "resultados",
	selectedText = "seleccionado",
	selectedPluralText = "seleccionados",
	filterText = "filtro",
	filtersText = "filtros",
	activeText = "activo",
	activePluralText = "activos",
	clearSearchAriaLabel = "Limpiar búsqueda",
	paginationMode = "pagination",
	itemsPerPage = ITEMS_PER_PAGE,
	onLoadMore,
	hasMore = false,
	isLoadingMore = false,
	initialFilters,
	onFiltersChange,
	initialSearch,
	onSearchChange,
	initialSort,
	onSortChange,
}: DataTableProps<T>) {
	const isMobile = useIsMobile();
	const [searchQuery, setSearchQuery] = useState(initialSearch ?? "");
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
		initialFilters ?? {},
	);
	const [sortState, setSortState] = useState<SortState>(
		initialSort ?? { field: null, direction: "desc" },
	);
	const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
	const [currentPage, setCurrentPage] = useState(1);
	const scrollSentinelRef = useRef<HTMLDivElement>(null);

	// Calculate active filter count
	const activeFilterCount = useMemo(
		() =>
			Object.values(activeFilters).reduce((acc, arr) => acc + arr.length, 0),
		[activeFilters],
	);

	// Get active filters for inline display
	const activeFiltersList = useMemo<ActiveFilter[]>(() => {
		return filters
			.map((filter) => {
				const values = activeFilters[filter.id] || [];
				return {
					filterId: filter.id,
					filterLabel: filter.label,
					values: values.map((v) => {
						const option = filter.options.find((o) => o.value === v);
						return { value: v, label: option?.label || v, icon: option?.icon };
					}),
				};
			})
			.filter((f) => f.values.length > 0);
	}, [filters, activeFilters]);

	// Toggle filter value
	const toggleFilter = useCallback((filterId: string, value: string) => {
		setActiveFilters((prev) => {
			const current = prev[filterId] || [];
			const updated = current.includes(value)
				? current.filter((v) => v !== value)
				: [...current, value];
			return { ...prev, [filterId]: updated };
		});
		setCurrentPage(1);
	}, []);

	// Clear all filters
	const clearAllFilters = useCallback(() => {
		setActiveFilters({});
		setSearchQuery("");
		setCurrentPage(1);
	}, []);

	// Clear single filter group
	const clearFilterGroup = useCallback((filterId: string) => {
		setActiveFilters((prev) => ({ ...prev, [filterId]: [] }));
		setCurrentPage(1);
	}, []);

	// Remove single filter
	const removeFilter = useCallback((filterId: string, value: string) => {
		setActiveFilters((prev) => ({
			...prev,
			[filterId]: (prev[filterId] || []).filter((v) => v !== value),
		}));
		setCurrentPage(1);
	}, []);

	// Notify parent of filter changes for URL persistence
	const prevFiltersRef = useRef(activeFilters);
	useEffect(() => {
		if (onFiltersChange && prevFiltersRef.current !== activeFilters) {
			// Only include non-empty filter arrays
			const cleanFilters = Object.fromEntries(
				Object.entries(activeFilters).filter(([, v]) => v.length > 0),
			);
			onFiltersChange(cleanFilters);
		}
		prevFiltersRef.current = activeFilters;
	}, [activeFilters, onFiltersChange]);

	// Notify parent of search changes for URL persistence
	const prevSearchRef = useRef(searchQuery);
	useEffect(() => {
		if (onSearchChange && prevSearchRef.current !== searchQuery) {
			onSearchChange(searchQuery);
		}
		prevSearchRef.current = searchQuery;
	}, [searchQuery, onSearchChange]);

	// Notify parent of sort changes for URL persistence
	const prevSortRef = useRef(sortState);
	useEffect(() => {
		if (onSortChange && prevSortRef.current !== sortState) {
			onSortChange(sortState);
		}
		prevSortRef.current = sortState;
	}, [sortState, onSortChange]);

	// Toggle sort
	const toggleSort = useCallback((field: string) => {
		setSortState((prev) => ({
			field,
			direction:
				prev.field === field && prev.direction === "asc" ? "desc" : "asc",
		}));
	}, []);

	// Toggle row selection
	const toggleRowSelection = useCallback((id: string) => {
		setSelectedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	// Toggle all rows selection
	const toggleAllRows = useCallback(
		(items: T[]) => {
			setSelectedRows((prev) => {
				if (prev.size === items.length) {
					return new Set();
				}
				return new Set(items.map(getId));
			});
		},
		[getId],
	);

	// Get nested value from object
	const getNestedValue = (obj: T, path: string): unknown => {
		return path.split(".").reduce((acc: unknown, part: string) => {
			if (acc && typeof acc === "object" && part in acc) {
				return (acc as Record<string, unknown>)[part];
			}
			return undefined;
		}, obj);
	};

	// Filter and sort data
	const filteredData = useMemo(() => {
		let result = data.filter((item) => {
			// Search filter
			const matchesSearch =
				searchQuery === "" ||
				searchKeys.some((key) => {
					const value = getNestedValue(item, key as string);
					return String(value)
						.toLowerCase()
						.includes(searchQuery.toLowerCase());
				});

			// Active filters
			const matchesFilters = Object.entries(activeFilters).every(
				([filterId, values]) => {
					if (values.length === 0) return true;
					const itemValue = getNestedValue(item, filterId);
					return values.includes(String(itemValue));
				},
			);

			return matchesSearch && matchesFilters;
		});

		// Sort
		if (sortState.field) {
			result = [...result].sort((a, b) => {
				const aVal = getNestedValue(a, sortState.field!);
				const bVal = getNestedValue(b, sortState.field!);
				const direction = sortState.direction === "asc" ? 1 : -1;

				if (aVal == null) return 1;
				if (bVal == null) return -1;

				if (typeof aVal === "number" && typeof bVal === "number") {
					return (aVal - bVal) * direction;
				}
				return String(aVal).localeCompare(String(bVal)) * direction;
			});
		}

		return result;
	}, [data, searchQuery, searchKeys, activeFilters, sortState]);

	// Pagination or Infinite Scroll
	const totalPages = Math.ceil(filteredData.length / itemsPerPage);
	const paginatedData = useMemo(() => {
		if (paginationMode === "infinite-scroll") {
			// For infinite scroll, show all filtered data (parent manages loading more)
			return filteredData;
		}
		const start = (currentPage - 1) * itemsPerPage;
		return filteredData.slice(start, start + itemsPerPage);
	}, [filteredData, currentPage, paginationMode, itemsPerPage]);

	// Infinite scroll: Intersection Observer
	useEffect(() => {
		if (
			paginationMode !== "infinite-scroll" ||
			!onLoadMore ||
			!hasMore ||
			isLoadingMore
		) {
			return;
		}

		const sentinel = scrollSentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting && hasMore && !isLoadingMore) {
					onLoadMore();
				}
			},
			{
				rootMargin: "100px",
			},
		);

		observer.observe(sentinel);

		return () => {
			observer.disconnect();
		};
	}, [paginationMode, onLoadMore, hasMore, isLoadingMore]);

	// Filter visible columns for mobile
	const visibleColumns = useMemo(() => {
		if (isMobile) {
			return columns.filter((col) => !col.hideOnMobile);
		}
		return columns;
	}, [columns, isMobile]);

	return (
		<>
			<div
				className={cn(
					"rounded-lg border border-border bg-card overflow-hidden",
					paginationMode === "infinite-scroll" && "relative",
				)}
			>
				{/* Header with Search and Filters */}
				<div
					className={cn(
						"border-b border-border bg-muted/20",
						paginationMode === "infinite-scroll" &&
							"sticky top-0 z-10 bg-card/95 backdrop-blur-sm shadow-sm",
					)}
				>
					<div className="flex items-center gap-2 p-3">
						{/* Search Input */}
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setCurrentPage(1);
								}}
								className="pl-9 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery("")}
									aria-label={clearSearchAriaLabel}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>

						{/* Desktop: Inline Filter Popovers */}
						<div className="hidden md:flex items-center gap-1.5">
							{filters.map((filter) => (
								<FilterPopover
									key={filter.id}
									filter={filter}
									activeValues={activeFilters[filter.id] || []}
									onToggleFilter={(value) => toggleFilter(filter.id, value)}
									onClear={() => clearFilterGroup(filter.id)}
									clearText={clearText}
								/>
							))}
						</div>

						{/* Mobile: Filter Summary Button */}
						<div className="md:hidden">
							<InlineFilterSummary
								activeFilters={activeFiltersList}
								onRemoveFilter={removeFilter}
								onClearAll={clearAllFilters}
								onOpenFilters={() => setIsDrawerOpen(true)}
								compact
								filterButtonText={filterButtonText}
								clearAllText={clearAllText}
								filterText={filterText}
								filtersText={filtersText}
							/>
						</div>
					</div>

					{/* Desktop: Active Filter Tags */}
					{!isMobile && activeFilterCount > 0 && (
						<div className="px-3 pb-3">
							<InlineFilterSummary
								activeFilters={activeFiltersList}
								onRemoveFilter={removeFilter}
								onClearAll={clearAllFilters}
								onOpenFilters={() => {}}
								filterButtonText={filterButtonText}
								clearAllText={clearAllText}
								filterText={filterText}
								filtersText={filtersText}
							/>
						</div>
					)}
				</div>

				{/* Table */}
				<div
					className={cn(
						"overflow-x-auto",
						isLoading && SKELETON_HEIGHTS.TABLE_MIN,
					)}
				>
					<table className="w-full">
						<thead>
							<tr className="border-b border-border bg-muted/30">
								{selectable && (
									<th className="w-10 p-3 text-left">
										<Checkbox
											checked={
												selectedRows.size === paginatedData.length &&
												paginatedData.length > 0
											}
											onCheckedChange={() => toggleAllRows(paginatedData)}
										/>
									</th>
								)}
								{visibleColumns.map((column) => (
									<th
										key={column.id}
										className={cn(
											"p-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
											column.className,
										)}
									>
										{column.sortable ? (
											<button
												onClick={() => toggleSort(column.accessorKey as string)}
												aria-label={`Ordenar por ${column.header}`}
												className="flex items-center gap-1 hover:text-foreground transition-colors"
											>
												{column.header}
												<ArrowUpDown
													className={cn(
														"h-3 w-3",
														sortState.field === column.accessorKey &&
															"text-primary",
													)}
												/>
											</button>
										) : (
											column.header
										)}
									</th>
								))}
								{actions && <th className="w-10 p-3" />}
							</tr>
						</thead>
						<tbody>
							{isLoading
								? // Skeleton loading rows
									Array.from({ length: itemsPerPage }).map((_, index) => (
										<tr
											key={`skeleton-${index}`}
											className="border-b border-border"
										>
											{selectable && (
												<td className="p-3">
													<Skeleton className="h-4 w-4 rounded" />
												</td>
											)}
											{visibleColumns.map((column) => (
												<td
													key={column.id}
													className={cn("p-3", column.className)}
												>
													<Skeleton
														className={cn(
															"h-4 w-full",
															index % 3 === 0 && "w-3/4",
															index % 3 === 1 && "w-full",
															index % 3 === 2 && "w-5/6",
														)}
													/>
												</td>
											))}
											{actions && (
												<td className="p-3">
													<Skeleton className="h-8 w-8 rounded" />
												</td>
											)}
										</tr>
									))
								: paginatedData.length === 0
									? // Empty state with same height as skeleton
										Array.from({ length: itemsPerPage }).map((_, index) =>
											index === Math.floor(itemsPerPage / 2) - 1 ? (
												<tr
													key={`empty-${index}`}
													className="border-b border-border"
												>
													<td
														colSpan={
															visibleColumns.length +
															(selectable ? 1 : 0) +
															(actions ? 1 : 0)
														}
														rowSpan={3}
														className="p-8"
													>
														<div className="flex flex-col items-center justify-center gap-4 text-center">
															<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
																<EmptyIcon className="h-8 w-8 text-muted-foreground" />
															</div>
															<div className="space-y-1">
																<p className="text-sm font-medium text-foreground">
																	{emptyMessage}
																</p>
																<p className="text-xs text-muted-foreground">
																	Intenta ajustar los filtros o la búsqueda
																</p>
															</div>
															{(emptyActionHref || onEmptyAction) &&
																emptyActionLabel && (
																	<div>
																		{emptyActionHref ? (
																			<Button asChild size="sm">
																				<Link href={emptyActionHref}>
																					<Plus className="mr-2 h-4 w-4" />
																					{emptyActionLabel}
																				</Link>
																			</Button>
																		) : (
																			<Button size="sm" onClick={onEmptyAction}>
																				<Plus className="mr-2 h-4 w-4" />
																				{emptyActionLabel}
																			</Button>
																		)}
																	</div>
																)}
														</div>
													</td>
												</tr>
											) : index >= Math.floor(itemsPerPage / 2) &&
											  index < Math.floor(itemsPerPage / 2) + 2 ? null : (
												<tr
													key={`empty-spacer-${index}`}
													className="border-b border-border h-12"
												>
													<td
														colSpan={
															visibleColumns.length +
															(selectable ? 1 : 0) +
															(actions ? 1 : 0)
														}
													/>
												</tr>
											),
										)
									: paginatedData.map((item) => {
											const id = getId(item);
											return (
												<tr
													key={id}
													onClick={() => onRowClick?.(item)}
													className={cn(
														"border-b border-border transition-colors",
														onRowClick && "cursor-pointer hover:bg-muted/50",
														selectedRows.has(id) && "bg-primary/5",
													)}
												>
													{selectable && (
														<td
															className="p-3"
															onClick={(e) => e.stopPropagation()}
														>
															<Checkbox
																checked={selectedRows.has(id)}
																onCheckedChange={() => toggleRowSelection(id)}
															/>
														</td>
													)}
													{visibleColumns.map((column) => (
														<td
															key={column.id}
															className={cn("p-3 text-sm", column.className)}
														>
															{column.cell
																? column.cell(item)
																: String(
																		getNestedValue(
																			item,
																			column.accessorKey as string,
																		) ?? "",
																	)}
														</td>
													))}
													{actions && (
														<td
															className="p-3"
															onClick={(e) => e.stopPropagation()}
														>
															{actions(item)}
														</td>
													)}
												</tr>
											);
										})}
						</tbody>
					</table>
				</div>

				{/* Footer with Pagination or Infinite Scroll */}
				<div className="border-t border-border px-3 py-2 flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
					<div className="flex items-center gap-2">
						<span className="tabular-nums">
							{paginationMode === "infinite-scroll"
								? `${paginatedData.length} / ${filteredData.length}`
								: filteredData.length}
						</span>
						<span>{filteredData.length !== 1 ? resultsText : resultText}</span>
						{selectedRows.size > 0 && (
							<span className="text-primary">
								• {selectedRows.size}{" "}
								{selectedRows.size !== 1 ? selectedPluralText : selectedText}
							</span>
						)}
					</div>
					{paginationMode === "pagination" && totalPages > 1 && (
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="h-7 w-7 p-0"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<span className="px-2 tabular-nums text-xs">
								{currentPage} / {totalPages}
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setCurrentPage((p) => Math.min(totalPages, p + 1))
								}
								disabled={currentPage === totalPages}
								className="h-7 w-7 p-0"
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>

				{/* Infinite Scroll Sentinel and Loading Indicator */}
				{paginationMode === "infinite-scroll" && (
					<>
						<div ref={scrollSentinelRef} className="h-1" />
						{isLoadingMore && (
							<div className="border-t border-border px-3 py-4 flex items-center justify-center text-sm text-muted-foreground bg-muted/20">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								<span>Cargando más...</span>
							</div>
						)}
						{!hasMore && paginatedData.length > 0 && (
							<div className="border-t border-border px-3 py-2 text-center text-sm text-muted-foreground bg-muted/20">
								<span>No hay más resultados</span>
							</div>
						)}
					</>
				)}
			</div>

			{/* Mobile Filter Drawer */}
			<FilterDrawer
				isOpen={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
				filters={filters}
				activeFilters={activeFilters}
				onToggleFilter={toggleFilter}
				onClearAll={clearAllFilters}
				filtersTitleText={filtersTitleText}
				clearText={clearText}
				applyFiltersText={applyFiltersText}
				filterText={filterText}
				filtersText={filtersText}
				activeText={activeText}
				activePluralText={activePluralText}
			/>
		</>
	);
}

"use client";

import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { CatalogItem } from "@/types/catalog";
import { useCatalogSearch } from "@/hooks/useCatalogSearch";
import { fetchCatalogItemById } from "@/lib/catalogs";
import { LabelWithInfo } from "../ui/LabelWithInfo";
import { AddCatalogItemDialog } from "./AddCatalogItemDialog";
import { useIsMobile } from "@/hooks/use-mobile";

type OptionRenderer = (
	option: CatalogItem,
	isSelected: boolean,
) => React.ReactNode;

interface CatalogSelectorProps {
	catalogKey: string;
	/** HTML id attribute for the trigger button (for form label association) */
	id?: string;
	label?: string;
	labelDescription?: string;
	/** Field tier for 3-tier completeness indicators (RED/YELLOW/GREY dot) */
	tier?: import("@/types/completeness").FieldTier;
	value?: string;
	placeholder?: string;
	searchPlaceholder?: string;
	helperText?: string;
	emptyState?: string;
	disabled?: boolean;
	required?: boolean;
	pageSize?: number;
	debounceMs?: number;
	autoFocusSearch?: boolean;
	typeLabel?: string;
	onChange?: (option: CatalogItem | null) => void;
	onValueChange?: (value: string | null) => void;
	getOptionValue?: (option: CatalogItem) => string;
	renderOption?: OptionRenderer;
	className?: string;
	/** Filter by va_code in metadata (for alert types) */
	vaCode?: string;
	/** Exclude automatable items (for alert types) */
	excludeAutomatable?: boolean;
}

function Spinner({
	size = "md",
	className,
	...props
}: React.ComponentProps<"div"> & { size?: "sm" | "md" | "lg" }) {
	const sizeClass =
		size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

	return (
		<div
			data-slot="spinner"
			className={cn(
				"inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
				sizeClass,
				className,
			)}
			aria-label="Loading"
			role="status"
			{...props}
		/>
	);
}

const defaultRenderOption: OptionRenderer = (option, isSelected) => (
	<div className="flex w-full items-center justify-between gap-3">
		<span className="text-sm font-medium text-foreground">{option.name}</span>
		{isSelected && (
			<Check
				className="h-4 w-4 text-primary"
				aria-hidden="true"
				data-testid="catalog-selector-check-icon"
			/>
		)}
	</div>
);

interface CatalogSelectorCommandContentProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder: string;
	autoFocusSearch: boolean;
	loading: boolean;
	error: string | null;
	mappedItems: Array<{ item: CatalogItem; value: string; label: string }>;
	emptyState: string;
	allowNewItems: boolean;
	onAddNewClick: () => void;
	selectedOption: CatalogItem | null;
	getOptionValue?: (option: CatalogItem) => string;
	renderOption: OptionRenderer;
	onSelect: (value: string) => void;
	listRef: React.RefObject<HTMLDivElement | null>;
	loadingMore: boolean;
	shouldShowSummary: boolean;
	resultSummary: string;
	isMobile?: boolean;
}

function CatalogSelectorCommandContent({
	searchTerm,
	onSearchChange,
	searchPlaceholder,
	autoFocusSearch,
	loading,
	error,
	mappedItems,
	emptyState,
	allowNewItems,
	onAddNewClick,
	selectedOption,
	getOptionValue,
	renderOption,
	onSelect,
	listRef,
	loadingMore,
	shouldShowSummary,
	resultSummary,
	isMobile = false,
}: CatalogSelectorCommandContentProps): React.ReactElement {
	return (
		<Command
			shouldFilter={false}
			className={cn(isMobile && "flex flex-col h-full")}
		>
			<CommandInput
				value={searchTerm}
				onValueChange={onSearchChange}
				placeholder={searchPlaceholder}
				autoFocus={autoFocusSearch}
				className={cn(isMobile && "sticky top-0 z-10")}
			/>

			{loading && (
				<div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
					<Spinner size="sm" />
					Buscando resultados…
				</div>
			)}

			{!loading && error && (
				<div className="px-3 py-4 text-sm text-destructive">{error}</div>
			)}

			{!loading && !error && (
				<>
					<CommandList
						ref={listRef}
						className={cn(
							isMobile
								? "flex-1 overflow-y-auto overscroll-contain"
								: "max-h-[300px]",
						)}
					>
						{mappedItems.length === 0 ? (
							<CommandEmpty>
								<div className="flex flex-col items-center gap-2 py-2 px-3">
									<span>{emptyState}</span>
									{allowNewItems && searchTerm.trim() && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={onAddNewClick}
											className="mt-2 bg-transparent"
										>
											<Plus className="mr-2 h-4 w-4" />
											Agregar &quot;{searchTerm.trim()}&quot;
										</Button>
									)}
								</div>
							</CommandEmpty>
						) : (
							<CommandGroup heading="Resultados">
								{mappedItems.map(({ item, value: optionValue }) => {
									const isSelected = selectedOption
										? (getOptionValue
												? getOptionValue(selectedOption)
												: (selectedOption.id ?? selectedOption.name)) ===
											optionValue
										: false;

									return (
										<CommandItem
											key={optionValue}
											value={optionValue}
											onSelect={() => onSelect(optionValue)}
											className={cn(isMobile && "py-3")}
										>
											{renderOption(item, isSelected)}
										</CommandItem>
									);
								})}
								{allowNewItems && searchTerm.trim() && (
									<CommandItem
										key="__add_new__"
										value="__add_new__"
										onSelect={onAddNewClick}
										className={cn("text-primary", isMobile && "py-3")}
									>
										<div className="flex items-center gap-2">
											<Plus className="h-4 w-4" />
											<span>Agregar &quot;{searchTerm.trim()}&quot;</span>
										</div>
									</CommandItem>
								)}
							</CommandGroup>
						)}
						{loadingMore && (
							<div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
								<Spinner size="sm" />
								Cargando más resultados...
							</div>
						)}
					</CommandList>
					{shouldShowSummary && (
						<div
							className={cn(
								"border-t px-3 py-2",
								isMobile
									? "sticky bottom-0 bg-background pb-[env(safe-area-inset-bottom)]"
									: "bg-popover",
							)}
						>
							<p
								className="text-[11px] text-muted-foreground"
								aria-live="polite"
							>
								{resultSummary}
							</p>
						</div>
					)}
				</>
			)}
		</Command>
	);
}

export function CatalogSelector({
	catalogKey,
	id,
	label,
	labelDescription,
	tier,
	value,
	placeholder,
	searchPlaceholder = "Buscar en el catálogo...",
	helperText,
	emptyState = "No se encontraron resultados para tu búsqueda.",
	disabled = false,
	required = false,
	pageSize,
	debounceMs,
	autoFocusSearch = true,
	typeLabel,
	onChange,
	onValueChange,
	getOptionValue,
	renderOption = defaultRenderOption,
	className,
	vaCode,
	excludeAutomatable,
}: CatalogSelectorProps): React.ReactElement {
	const labelId = useId();
	const listRef = useRef<HTMLDivElement>(null);
	const isMobile = useIsMobile();
	const resolvedPlaceholder =
		placeholder ??
		(label ? `Seleccionar ${label.toLowerCase()}` : "Seleccionar opción");
	const resolvedType = typeLabel ?? label?.toLowerCase() ?? "opción";
	const isControlled = value !== undefined;

	// Initialize selectedLabel as empty - don't use value directly as it may be an ID
	// The label will be resolved once items are loaded and matched
	const [selectedLabel, setSelectedLabel] = useState("");
	const [selectedOption, setSelectedOption] = useState<CatalogItem | null>(
		null,
	);
	const [open, setOpen] = useState(false);
	const [showResults, setShowResults] = useState(false);
	const [pagesSearchedForValue, setPagesSearchedForValue] = useState(0);
	const [lastSearchedValue, setLastSearchedValue] = useState<
		string | undefined
	>(value);
	const [fetchingById, setFetchingById] = useState(false);
	// Track which value we've already attempted to fetch by ID to prevent infinite loops
	const fetchedByIdForValueRef = useRef<string | undefined>(undefined);

	const {
		items,
		catalog,
		pagination,
		loading,
		loadingMore,
		error,
		searchTerm,
		setSearchTerm,
		loadMore,
		reload,
		hasMore,
	} = useCatalogSearch({
		catalogKey,
		pageSize,
		debounceMs,
		enabled: !disabled,
		vaCode,
		excludeAutomatable,
	});

	// State for "Add new item" dialog
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const allowNewItems = catalog?.allowNewItems ?? false;

	const mappedItems = useMemo(
		() =>
			items.map((item) => ({
				item,
				value: getOptionValue ? getOptionValue(item) : (item.id ?? item.name),
				label: item.name,
			})),
		[items, getOptionValue],
	);

	// Reset search counter and fetch-by-ID tracker when value changes
	useEffect(() => {
		if (value !== lastSearchedValue) {
			setPagesSearchedForValue(0);
			setLastSearchedValue(value);
			fetchedByIdForValueRef.current = undefined;
		}
	}, [value, lastSearchedValue]);

	// Helper to get the value from an option
	const getOptionValueResolved = (option: CatalogItem): string => {
		return getOptionValue ? getOptionValue(option) : (option.id ?? option.name);
	};

	// Helper to check if an option matches a given value
	// This handles lookups by ID, shortName (metadata.shortName), or code (metadata.code)
	const optionMatchesValue = (option: CatalogItem, val: string): boolean => {
		// Check by ID or custom getOptionValue
		if (getOptionValueResolved(option) === val) {
			return true;
		}
		// Check by metadata.shortName (e.g., "MXN" for currencies)
		const metadata = option.metadata as
			| { shortName?: string; code?: string }
			| null
			| undefined;
		if (metadata?.shortName === val) {
			return true;
		}
		// Check by metadata.code
		// This matches both 2-letter country codes (e.g., "MX") and numeric SAT codes (e.g., "01", "03")
		if (metadata?.code === val) {
			return true;
		}
		return false;
	};

	// Effect to find and set the selected item when value or items change
	useEffect(() => {
		if (!isControlled) {
			return;
		}

		if (!value) {
			setSelectedLabel("");
			setSelectedOption(null);
			return;
		}

		// If we already have a selectedOption that matches the current value,
		// preserve it - don't let filtered search results overwrite the label
		if (selectedOption && optionMatchesValue(selectedOption, value)) {
			// Ensure label is set correctly (in case it was empty initially)
			if (selectedLabel !== selectedOption.name) {
				setSelectedLabel(selectedOption.name);
			}
			return;
		}

		// If selectedOption exists but doesn't match the value, clear it
		// This happens when the value prop changes
		if (selectedOption && !optionMatchesValue(selectedOption, value)) {
			setSelectedOption(null);
			setSelectedLabel("");
		}

		// Find items that match the value by ID, shortName, or code
		// When there are multiple matches (e.g., SAT currencies with duplicate shortNames),
		// prefer the one with the lowest numeric code (which is the primary entry)
		const matches = items.filter((entry) => optionMatchesValue(entry, value));
		let match: CatalogItem | undefined;
		if (matches.length === 1) {
			match = matches[0];
		} else if (matches.length > 1) {
			// Sort by metadata.code numerically (lowest first) to get the primary entry
			match = matches.sort((a, b) => {
				const aCode = parseInt(
					(a.metadata as { code?: string } | null)?.code ?? "999999",
					10,
				);
				const bCode = parseInt(
					(b.metadata as { code?: string } | null)?.code ?? "999999",
					10,
				);
				return aCode - bCode;
			})[0];
		}

		if (match) {
			setSelectedOption(match);
			setSelectedLabel(match.name);
			setPagesSearchedForValue(0); // Reset search counter when found
		} else if (
			!loading &&
			!loadingMore &&
			items.length > 0 &&
			hasMore &&
			pagesSearchedForValue < 5
		) {
			// If we have items loaded but no match, try loading more pages
			// Limit to 5 pages to avoid infinite loops
			setPagesSearchedForValue((prev) => prev + 1);
			loadMore().catch(() => {
				// Ignore errors, will fall back to fetching by ID
			});
		} else if (
			!loading &&
			!loadingMore &&
			!match &&
			pagination !== null &&
			!fetchingById &&
			fetchedByIdForValueRef.current !== value
		) {
			// If we've loaded data but still can't find the item, try fetching by ID directly
			// This handles cases where the item exists but isn't in the search results
			// The backend supports lookup by ID, shortName (metadata.shortName), or code (metadata.code)
			// Mark that we've attempted to fetch this value to prevent infinite loops
			fetchedByIdForValueRef.current = value;
			setFetchingById(true);
			fetchCatalogItemById(catalogKey, value)
				.then((item) => {
					// Backend found the item by ID, shortName, or code - use it
					// The backend's lookup is authoritative, so we trust the returned item
					setSelectedOption(item);
					setSelectedLabel(item.name);
				})
				.catch(() => {
					// If fetching by ID fails, fallback to showing the raw value
					setSelectedLabel(value);
				})
				.finally(() => {
					setFetchingById(false);
				});
		}
		// Note: selectedLabel is intentionally excluded from dependencies
		// It's only used for comparison to avoid unnecessary updates, not as input
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		isControlled,
		value,
		items,
		getOptionValue,
		loading,
		loadingMore,
		hasMore,
		loadMore,
		pagesSearchedForValue,
		pagination,
		selectedOption,
		catalogKey,
		fetchingById,
	]);

	const handleSelect = (optionValue: string): void => {
		const match = mappedItems.find((entry) => entry.value === optionValue);
		if (!match) {
			return;
		}

		setSelectedOption(match.item);
		const labelValue = match.item.name;

		if (!isControlled) {
			setSelectedLabel(labelValue);
		}

		setSearchTerm("");
		setShowResults(false);
		setOpen(false);

		onValueChange?.(optionValue);
		onChange?.(match.item);
	};

	const handleSearchChange = (next: string): void => {
		setShowResults(true);
		setSearchTerm(next);
	};

	const handleOpenChange = (next: boolean): void => {
		setOpen(next);
		setShowResults(next);
	};

	const handleAddNewClick = useCallback((): void => {
		setOpen(false);
		setAddDialogOpen(true);
	}, []);

	const handleItemCreated = useCallback(
		(newItem: CatalogItem): void => {
			// Reload the catalog to include the new item
			reload();

			// Select the newly created item
			setSelectedOption(newItem);
			setSelectedLabel(newItem.name);

			const optionValue = getOptionValue
				? getOptionValue(newItem)
				: (newItem.id ?? newItem.name);
			onValueChange?.(optionValue);
			onChange?.(newItem);
		},
		[reload, getOptionValue, onValueChange, onChange],
	);

	// Track if we're currently processing a load to prevent duplicate calls
	const isLoadingMoreRef = useRef(false);

	// Handle infinite scroll
	const handleScroll = useCallback(async () => {
		// Find the actual scrollable element - could be the ref or the cmdk-list element inside
		const list = listRef.current;
		if (
			!list ||
			loadingMore ||
			loading ||
			!hasMore ||
			isLoadingMoreRef.current
		) {
			return;
		}

		// Try to find the actual scrollable element (cmdk-list)
		const scrollableElement =
			list.querySelector<HTMLElement>("[cmdk-list]") || list;

		if (!scrollableElement) {
			return;
		}

		const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
		const threshold = 100; // Trigger when 100px from bottom for better UX

		// Check if we're near the bottom
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

		if (isNearBottom) {
			isLoadingMoreRef.current = true;
			try {
				await loadMore();
			} catch {
				// Ignore errors
			} finally {
				isLoadingMoreRef.current = false;
			}
		}
	}, [loadMore, loadingMore, loading, hasMore]);

	// After items are loaded, check if we need to load more
	// This ensures we continue loading until the user scrolls away or no more pages are available
	useEffect(() => {
		if (
			!open ||
			loadingMore ||
			loading ||
			!hasMore ||
			isLoadingMoreRef.current
		) {
			return;
		}

		const list = listRef.current;
		if (!list) {
			return;
		}

		// Wait for DOM to update after items change
		const timeoutId = setTimeout(() => {
			const scrollableElement =
				list.querySelector<HTMLElement>("[cmdk-list]") || list;

			if (!scrollableElement) {
				return;
			}

			const { scrollTop, scrollHeight, clientHeight } = scrollableElement;
			const threshold = 100;

			// If we're still near the bottom after loading, load more
			const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

			if (isNearBottom && hasMore && !loadingMore && !loading) {
				isLoadingMoreRef.current = true;
				loadMore()
					.catch(() => {
						// Ignore errors
					})
					.finally(() => {
						isLoadingMoreRef.current = false;
					});
			}
		}, 100); // Small delay to allow DOM to update

		return () => {
			clearTimeout(timeoutId);
		};
	}, [items, open, hasMore, loadingMore, loading, loadMore]);

	// Use a ref for the scroll handler to avoid constant listener re-attachment
	const handleScrollRef = useRef(handleScroll);
	handleScrollRef.current = handleScroll;

	// Stable scroll handler that uses the ref
	const stableScrollHandler = useCallback(() => {
		handleScrollRef.current();
	}, []);

	// Ref to track the scrollable element for cleanup
	const scrollableElementRef = useRef<HTMLElement | null>(null);

	// Set up scroll listener - only depends on `open` to avoid constant re-attachment
	useEffect(() => {
		if (!open) {
			return;
		}

		let timeoutId: NodeJS.Timeout;

		// Wait for the DOM to be ready before attaching listener
		timeoutId = setTimeout(() => {
			const list = listRef.current;
			if (!list) {
				return;
			}

			// Find the actual scrollable element
			const scrollableElement =
				list.querySelector<HTMLElement>("[cmdk-list]") || list;

			if (scrollableElement) {
				scrollableElementRef.current = scrollableElement;
				scrollableElement.addEventListener("scroll", stableScrollHandler, {
					passive: true,
				});
			}
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			if (scrollableElementRef.current) {
				scrollableElementRef.current.removeEventListener(
					"scroll",
					stableScrollHandler,
				);
				scrollableElementRef.current = null;
			}
		};
	}, [open, stableScrollHandler]);

	const resultSummary = useMemo(() => {
		if (loading) {
			return "Buscando resultados...";
		}

		if (error) {
			return error;
		}

		if (!pagination) {
			return "";
		}

		return `Mostrando ${items.length} de ${pagination.total} resultados`;
	}, [loading, error, pagination, items.length]);

	const shouldShowSummary = open && showResults && Boolean(resultSummary);

	const triggerButton = (
		<Button
			id={id}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			aria-labelledby={label ? labelId : undefined}
			disabled={disabled}
			className="w-full justify-between text-left font-normal bg-transparent"
		>
			<span className="truncate">{selectedLabel || resolvedPlaceholder}</span>
			<span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
				<span className="hidden sm:inline">{resolvedType}</span>
				<ChevronsUpDown
					className="h-4 w-4 shrink-0 opacity-50"
					aria-hidden="true"
				/>
			</span>
		</Button>
	);

	const commandContentProps: CatalogSelectorCommandContentProps = {
		searchTerm,
		onSearchChange: handleSearchChange,
		searchPlaceholder,
		autoFocusSearch,
		loading,
		error,
		mappedItems,
		emptyState,
		allowNewItems,
		onAddNewClick: handleAddNewClick,
		selectedOption,
		getOptionValue,
		renderOption,
		onSelect: handleSelect,
		listRef,
		loadingMore,
		shouldShowSummary,
		resultSummary,
		isMobile,
	};

	return (
		<div className={cn("space-y-2", className)}>
			{label &&
				(labelDescription || tier ? (
					<LabelWithInfo
						htmlFor={labelId}
						description={labelDescription}
						required={required}
						tier={tier}
					>
						{label}
					</LabelWithInfo>
				) : (
					<Label id={labelId} className="text-sm font-medium text-foreground">
						{label}
						{required && <span className="ml-1 text-destructive">*</span>}
					</Label>
				))}

			{isMobile ? (
				<Dialog open={open} onOpenChange={handleOpenChange}>
					<DialogTrigger asChild>{triggerButton}</DialogTrigger>
					<DialogContent
						className="h-dvh max-h-dvh w-screen max-w-none m-0 p-0 rounded-none flex flex-col gap-0 border-0 [&>button]:hidden"
						showCloseButton={false}
					>
						{/* Fixed header with close button */}
						<DialogHeader className="flex-none px-4 pt-[env(safe-area-inset-top)] pb-2 border-b bg-background">
							<div className="flex items-center justify-between">
								<DialogTitle className="text-base font-semibold">
									{label || "Seleccionar opción"}
									{required && <span className="ml-1 text-destructive">*</span>}
								</DialogTitle>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 -mr-2"
									onClick={() => setOpen(false)}
								>
									<X className="h-4 w-4" />
									<span className="sr-only">Cerrar</span>
								</Button>
							</div>
						</DialogHeader>
						{/* Flex-grow content area that adapts to keyboard */}
						<div className="flex-1 min-h-0 overflow-hidden">
							<CatalogSelectorCommandContent {...commandContentProps} />
						</div>
					</DialogContent>
				</Dialog>
			) : (
				<Popover open={open} onOpenChange={handleOpenChange}>
					<PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
					<PopoverContent
						className="w-[--radix-popover-trigger-width] p-0"
						align="start"
					>
						<CatalogSelectorCommandContent {...commandContentProps} />
					</PopoverContent>
				</Popover>
			)}

			{helperText && (
				<p className="text-xs text-muted-foreground">{helperText}</p>
			)}

			<AddCatalogItemDialog
				open={addDialogOpen}
				onOpenChange={setAddDialogOpen}
				catalogKey={catalogKey}
				catalogName={catalog?.name}
				initialValue={searchTerm.trim()}
				onItemCreated={handleItemCreated}
			/>
		</div>
	);
}

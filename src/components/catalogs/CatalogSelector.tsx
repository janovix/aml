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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
	label?: string;
	labelDescription?: string;
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
		<Command shouldFilter={false}>
			<CommandInput
				value={searchTerm}
				onValueChange={onSearchChange}
				placeholder={searchPlaceholder}
				autoFocus={autoFocusSearch}
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
						className={cn(isMobile ? "max-h-[60vh]" : "max-h-[300px]")}
					>
						{mappedItems.length === 0 ? (
							<CommandEmpty>
								<div className="flex flex-col items-center gap-2 py-2">
									<span>{emptyState}</span>
									{allowNewItems && searchTerm.trim() && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={onAddNewClick}
											className="mt-2"
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
										className="text-primary"
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
								"sticky bottom-0 border-t px-3 py-2",
								isMobile ? "bg-background" : "bg-popover",
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
	label,
	labelDescription,
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

	// Reset search counter when value changes
	useEffect(() => {
		if (value !== lastSearchedValue) {
			setPagesSearchedForValue(0);
			setLastSearchedValue(value);
		}
	}, [value, lastSearchedValue]);

	// Helper to get the value from an option
	const getOptionValueResolved = (option: CatalogItem): string => {
		return getOptionValue ? getOptionValue(option) : (option.id ?? option.name);
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
		if (selectedOption && getOptionValueResolved(selectedOption) === value) {
			// Ensure label is set correctly (in case it was empty initially)
			if (selectedLabel !== selectedOption.name) {
				setSelectedLabel(selectedOption.name);
			}
			return;
		}

		// If selectedOption exists but doesn't match the value, clear it
		// This happens when the value prop changes
		if (selectedOption && getOptionValueResolved(selectedOption) !== value) {
			setSelectedOption(null);
			setSelectedLabel("");
		}

		// Find the item by comparing the value (ID) with the item's ID or computed value
		const match = items.find((entry) => {
			return getOptionValueResolved(entry) === value;
		});

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
			!fetchingById
		) {
			// If we've loaded data but still can't find the item, try fetching by ID directly
			// This handles cases where the item exists but isn't in the search results
			setFetchingById(true);
			fetchCatalogItemById(catalogKey, value)
				.then((item) => {
					// Verify the item matches the value (in case getOptionValue is custom)
					if (getOptionValueResolved(item) === value) {
						setSelectedOption(item);
						setSelectedLabel(item.name);
					} else {
						setSelectedLabel(value);
					}
				})
				.catch(() => {
					// If fetching by ID fails, fallback to showing the raw value
					setSelectedLabel(value);
				})
				.finally(() => {
					setFetchingById(false);
				});
		}
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
		selectedLabel,
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

	// Set up scroll listener
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
				scrollableElement.addEventListener("scroll", handleScroll, {
					passive: true,
				});
			}
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			// Try to find and remove listener from current DOM state
			const list = listRef.current;
			if (list) {
				const element = list.querySelector<HTMLElement>("[cmdk-list]") || list;
				if (element) {
					element.removeEventListener("scroll", handleScroll);
				}
			}
		};
	}, [handleScroll, open]);

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
			variant="outline"
			role="combobox"
			aria-expanded={open}
			aria-labelledby={label ? labelId : undefined}
			disabled={disabled}
			className="w-full justify-between text-left font-normal"
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
				(labelDescription ? (
					<LabelWithInfo
						htmlFor={labelId}
						description={labelDescription}
						required={required}
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
				<Sheet open={open} onOpenChange={handleOpenChange}>
					<SheetTrigger asChild>{triggerButton}</SheetTrigger>
					<SheetContent
						side="bottom"
						className="h-[85vh] flex flex-col p-0 [&>button]:hidden"
					>
						<SheetHeader className="px-4 pt-4 pb-2 border-b">
							<SheetTitle>
								{label || "Seleccionar opción"}
								{required && <span className="ml-1 text-destructive">*</span>}
							</SheetTitle>
						</SheetHeader>
						<div className="flex-1 overflow-hidden">
							<CatalogSelectorCommandContent {...commandContentProps} />
						</div>
					</SheetContent>
				</Sheet>
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
